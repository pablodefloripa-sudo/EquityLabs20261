import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

interface GmailAction {
  action: "send" | "read" | "search";
  to?: string;
  subject?: string;
  body?: string;
  query?: string;
  maxResults?: number;
}

interface GoogleIntegration {
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  is_connected: boolean | null;
  scopes: string[] | null;
}

async function refreshTokenIfNeeded(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  integration: GoogleIntegration,
): Promise<string> {
  const accessToken = integration.access_token_encrypted;
  const refreshToken = integration.refresh_token_encrypted;
  const tokenExpiresAt = integration.token_expires_at;

  if (!accessToken) {
    throw new Error("Missing Google access token");
  }

  if (!tokenExpiresAt) {
    return accessToken;
  }

  const expiresAt = new Date(tokenExpiresAt);
  const now = new Date();

  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return accessToken;
  }

  if (!refreshToken) {
    throw new Error("Missing Google refresh token");
  }

  const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || tokenData.error || "Failed to refresh Google token");
  }

  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await supabase
    .from("user_integrations")
    .update({
      access_token_encrypted: tokenData.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq("user_id", userId)
    .eq("provider", "google");

  return tokenData.access_token;
}

async function sendEmail(accessToken: string, to: string, subject: string, body: string) {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "",
    body,
  ];

  const email = emailLines.join("\r\n");
  const encodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to send email");
  }

  return { messageId: data.id, threadId: data.threadId };
}

async function readEmails(accessToken: string, query: string, maxResults = 5) {
  const searchResponse = await fetch(
    `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const searchData = await searchResponse.json();
  if (!searchResponse.ok) {
    throw new Error(searchData.error?.message || "Failed to search emails");
  }

  if (!searchData.messages?.length) {
    return [];
  }

  const emails = await Promise.all(
    searchData.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
      const msgResponse = await fetch(
        `${GMAIL_API_BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!msgResponse.ok) return null;

      const msgData = await msgResponse.json();
      const headers = msgData.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: { name: string; value: string }) => h.name === name)?.value || "";

      return {
        id: msgData.id,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        snippet: msgData.snippet || "",
        date: getHeader("Date"),
      };
    }),
  );

  return emails.filter((email): email is NonNullable<typeof email> => email !== null);
}

function hasRequiredScopes(scopes: string[] | null | undefined) {
  if (!scopes?.length) return false;

  const normalizedScopes = new Set(scopes);
  return (
    normalizedScopes.has("https://www.googleapis.com/auth/gmail.send") ||
    normalizedScopes.has("https://www.googleapis.com/auth/gmail.readonly") ||
    normalizedScopes.has("https://mail.google.com/")
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "No autorizado",
          requiresAuth: true,
          message: "Inicia sesión para usar Gmail.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Sesión inválida o expirada",
          requiresAuth: true,
          message: "Vuelve a iniciar sesión para continuar.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: integration, error: integrationError } = await supabase
      .from("user_integrations")
      .select("access_token_encrypted, refresh_token_encrypted, token_expires_at, is_connected, scopes")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single<GoogleIntegration>();

    if (integrationError || !integration || !integration.is_connected) {
      return new Response(
        JSON.stringify({
          error: "Gmail no conectado",
          requiresAuth: true,
          message: "Conecta Gmail desde Integraciones > Google para habilitar envío y lectura de correos.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!hasRequiredScopes(integration.scopes)) {
      return new Response(
        JSON.stringify({
          error: "Permisos insuficientes",
          requiresAuth: true,
          message: "La conexión de Google existe, pero no incluye permisos de Gmail. Reconéctala con scopes de correo.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await refreshTokenIfNeeded(supabase, user.id, integration);
    const actionRequest: GmailAction = await req.json();

    switch (actionRequest.action) {
      case "send": {
        if (!actionRequest.to || !actionRequest.subject || !actionRequest.body) {
          return new Response(
            JSON.stringify({ error: "Faltan campos requeridos: to, subject, body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const result = await sendEmail(accessToken, actionRequest.to, actionRequest.subject, actionRequest.body);

        return new Response(
          JSON.stringify({
            success: true,
            action: "send",
            data: {
              messageId: result.messageId,
              threadId: result.threadId,
              message: `Email enviado a ${actionRequest.to}`,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      case "read":
      case "search": {
        const query = actionRequest.query || "in:inbox is:unread";
        const maxResults = actionRequest.maxResults || 5;
        const emails = await readEmails(accessToken, query, maxResults);

        return new Response(
          JSON.stringify({
            success: true,
            action: "read",
            data: {
              emails,
              count: emails.length,
              query,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Acción no soportada: ${actionRequest.action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
  } catch (error: unknown) {
    console.error("[Gmail] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        requiresAuth: /Gmail no conectado|Permisos insuficientes|refresh token|credentials/i.test(errorMessage),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
