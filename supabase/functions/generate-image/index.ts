import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getUserPlanState,
  isFreePlan,
  LOVABLE_AI_GATEWAY_URL,
} from "../_shared/subscription-routing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";
const OPENROUTER_DEFAULT_MODEL = "openai/gpt-image-1-mini";
const OPENROUTER_PRO_MODEL = "openai/gpt-image-1";
const LEGACY_DEFAULT_MODEL = "google/gemini-2.5-flash-image";
const LEGACY_PRO_MODEL = "google/gemini-3-pro-image-preview";

type ProviderName = "openrouter" | "gateway";

type ImageProviderSuccess = {
  ok: true;
  imageUrl: string;
  model: string;
  provider: ProviderName;
  usage: unknown;
};

type ImageProviderFailure = {
  ok: false;
  status: number;
  error: string;
};

type ImageProviderResult = ImageProviderSuccess | ImageProviderFailure;

function getOpenRouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-OpenRouter-Title": "EQuityLabs Generate Image",
  };
  const referer =
    Deno.env.get("OPENROUTER_HTTP_REFERER")
    || Deno.env.get("PUBLIC_SITE_URL")
    || Deno.env.get("SITE_URL");

  if (referer) {
    headers["HTTP-Referer"] = referer;
  }

  return headers;
}

function getProviderConfig(): { provider: ProviderName; apiKey: string } | null {
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
  if (openRouterApiKey) {
    return { provider: "openrouter", apiKey: openRouterApiKey };
  }

  const gatewayApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
  if (gatewayApiKey) {
    return { provider: "gateway", apiKey: gatewayApiKey };
  }

  return null;
}

function parseJson(text: string): Record<string, unknown> {
  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getErrorMessage(payload: Record<string, unknown>, status: number): string {
  const payloadError = payload.error;
  if (payloadError && typeof payloadError === "object" && "message" in payloadError && typeof payloadError.message === "string") {
    return payloadError.message;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return `Image generation failed (${status})`;
}

async function generateWithOpenRouter(
  apiKey: string,
  prompt: string,
  useProModel: boolean,
): Promise<ImageProviderResult> {
  const model = useProModel ? OPENROUTER_PRO_MODEL : OPENROUTER_DEFAULT_MODEL;
  const response = await fetch(OPENROUTER_IMAGE_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      prompt,
      quality: useProModel ? "high" : "medium",
      output_format: "png",
    }),
  });

  const responseText = await response.text();
  const payload = parseJson(responseText);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: getErrorMessage(payload, response.status),
    };
  }

  const imageEntry = Array.isArray(payload.data)
    ? payload.data[0] as Record<string, unknown> | undefined
    : undefined;
  const b64 = typeof imageEntry?.b64_json === "string" ? imageEntry.b64_json : "";
  const mediaType = typeof imageEntry?.media_type === "string" ? imageEntry.media_type : "image/png";

  if (!b64) {
    return {
      ok: false,
      status: 502,
      error: "No image returned by OpenRouter.",
    };
  }

  return {
    ok: true,
    imageUrl: `data:${mediaType};base64,${b64}`,
    model,
    provider: "openrouter",
    usage: payload.usage ?? null,
  };
}

async function generateWithLegacyGateway(
  apiKey: string,
  prompt: string,
  useProModel: boolean,
): Promise<ImageProviderResult> {
  const model = useProModel ? LEGACY_PRO_MODEL : LEGACY_DEFAULT_MODEL;
  const response = await fetch(LOVABLE_AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  const responseText = await response.text();
  const payload = parseJson(responseText);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: getErrorMessage(payload, response.status),
    };
  }

  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const firstChoice = choices[0] as { message?: Record<string, unknown> } | undefined;
  const message = firstChoice?.message;
  const images = Array.isArray(message?.images) ? message.images as Array<Record<string, unknown>> : [];
  const imageContent = Array.isArray(message?.content) ? message.content as Array<Record<string, unknown>> : [];
  const imageUrl =
    (images[0]?.image_url as { url?: string } | undefined)?.url
    || (typeof images[0]?.url === "string" ? images[0].url : undefined)
    || (imageContent.find((item) => item?.type === "image_url")?.image_url as { url?: string } | undefined)?.url;

  if (!imageUrl) {
    return {
      ok: false,
      status: 502,
      error: "No image returned by legacy gateway.",
    };
  }

  return {
    ok: true,
    imageUrl,
    model,
    provider: "gateway",
    usage: payload.usage ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Prompt invalido (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authToken = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(authToken);
    const userId = user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPlan = await getUserPlanState(supabaseUrl, supabaseKey, userId);
    if (isFreePlan(userPlan.plan)) {
      return new Response(JSON.stringify({ error: "La generacion de imagenes no esta incluida en el plan FREE." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerConfig = getProviderConfig();
    if (!providerConfig) {
      return new Response(JSON.stringify({ error: "AI no configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useProModel = model === "pro";
    const result = providerConfig.provider === "openrouter"
      ? await generateWithOpenRouter(providerConfig.apiKey, prompt, useProModel)
      : await generateWithLegacyGateway(providerConfig.apiKey, prompt, useProModel);

    if (!result.ok) {
      console.error("generate-image error", result.status, result.error);

      if (result.status === 429) {
        return new Response(JSON.stringify({ error: "Limite alcanzado, intenta de nuevo en un minuto." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (result.status === 402) {
        return new Response(JSON.stringify({ error: "Creditos AI agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status >= 400 ? result.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      imageUrl: result.imageUrl,
      model: result.model,
      provider: result.provider,
      usage: result.usage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-image error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
