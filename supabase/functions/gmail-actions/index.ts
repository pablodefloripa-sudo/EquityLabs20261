import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gmail API base URL
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

interface GmailAction {
  action: 'send' | 'read' | 'search';
  to?: string;
  subject?: string;
  body?: string;
  query?: string;
  maxResults?: number;
}

interface IntegrationTokens {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

// Refresh Google OAuth token if expired
async function refreshTokenIfNeeded(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  integration: IntegrationTokens
): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at);
  const now = new Date();
  
  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('[Gmail] Token expired or expiring soon, refreshing...');
    
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!googleClientId || !googleClientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Gmail] Token refresh failed:', errorText);
      throw new Error('Failed to refresh Google token. Please reconnect Gmail.');
    }
    
    const tokenData = await tokenResponse.json();
    const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    // Update tokens in database using fresh client
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase
      .from('user_integrations')
      .update({
        access_token_encrypted: tokenData.access_token,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google');
    
    console.log('[Gmail] Token refreshed successfully');
    return tokenData.access_token;
  }
  
  return integration.access_token;
}

// Send email via Gmail API
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId: string; threadId: string }> {
  // Create RFC 2822 formatted email
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  
  const email = emailLines.join('\r\n');
  const encodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gmail] Send failed:', errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('[Gmail] Email sent successfully:', data.id);
  
  return {
    messageId: data.id,
    threadId: data.threadId,
  };
}

// Read/search emails via Gmail API
async function readEmails(
  accessToken: string,
  query: string,
  maxResults: number = 5
): Promise<Array<{ id: string; from: string; subject: string; snippet: string; date: string }>> {
  // Search for messages
  const searchUrl = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  
  const searchResponse = await fetch(searchUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  
  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    console.error('[Gmail] Search failed:', errorText);
    throw new Error(`Failed to search emails: ${searchResponse.status}`);
  }
  
  const searchData = await searchResponse.json();
  
  if (!searchData.messages || searchData.messages.length === 0) {
    return [];
  }
  
  // Fetch details for each message
  const emails = await Promise.all(
    searchData.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
      const msgResponse = await fetch(
        `${GMAIL_API_BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      
      if (!msgResponse.ok) return null;
      
      const msgData = await msgResponse.json();
      const headers = msgData.payload?.headers || [];
      
      const getHeader = (name: string) => 
        headers.find((h: { name: string; value: string }) => h.name === name)?.value || '';
      
      return {
        id: msgData.id,
        from: getHeader('From'),
        subject: getHeader('Subject'),
        snippet: msgData.snippet || '',
        date: getHeader('Date'),
      };
    })
  );
  
  return emails.filter((e): e is NonNullable<typeof e> => e !== null);
}

serve(async (req) => {
  console.log('[Gmail] Action request received');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Inicia sesión primero.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Gmail] User authenticated: ${user.id}`);
    
    // Check Gmail integration status
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('access_token_encrypted, refresh_token_encrypted, token_expires_at, is_connected, scopes')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();
    
    if (integrationError || !integration || !integration.is_connected) {
      console.log('[Gmail] Integration not found or not connected');
      return new Response(
        JSON.stringify({ 
          error: 'Gmail no conectado',
          requiresAuth: true,
          message: 'Necesitas conectar tu cuenta de Gmail primero. Ve a Integraciones > Google y autoriza el acceso.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify Gmail scopes are present
    const requiredScopes = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'];
    const hasGmailScopes = requiredScopes.some(scope => 
      integration.scopes?.includes(scope) || integration.scopes?.includes('https://mail.google.com/')
    );
    
    if (!hasGmailScopes) {
      return new Response(
        JSON.stringify({
          error: 'Permisos insuficientes',
          requiresAuth: true,
          message: 'Tu integración de Google no incluye permisos de Gmail. Reconecta con los scopes de correo.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get fresh access token
    const accessToken = await refreshTokenIfNeeded(
      supabaseUrl,
      supabaseKey,
      user.id,
      {
        access_token: integration.access_token_encrypted!,
        refresh_token: integration.refresh_token_encrypted!,
        token_expires_at: integration.token_expires_at!,
      }
    );
    
    // Parse action request
    const actionRequest: GmailAction = await req.json();
    console.log(`[Gmail] Action: ${actionRequest.action}`);
    
    let result;
    
    switch (actionRequest.action) {
      case 'send':
        if (!actionRequest.to || !actionRequest.subject || !actionRequest.body) {
          return new Response(
            JSON.stringify({ error: 'Faltan campos: to, subject, body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        result = await sendEmail(
          accessToken,
          actionRequest.to,
          actionRequest.subject,
          actionRequest.body
        );
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'send',
            data: {
              messageId: result.messageId,
              threadId: result.threadId,
              message: `✅ Email enviado a ${actionRequest.to}`
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'read':
      case 'search':
        const query = actionRequest.query || 'in:inbox is:unread';
        const maxResults = actionRequest.maxResults || 5;
        
        result = await readEmails(accessToken, query, maxResults);
        
        return new Response(
          JSON.stringify({
            success: true,
            action: 'read',
            data: {
              emails: result,
              count: result.length,
              query: query
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      default:
        return new Response(
          JSON.stringify({ error: `Acción no soportada: ${actionRequest.action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
  } catch (error: unknown) {
    console.error('[Gmail] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
