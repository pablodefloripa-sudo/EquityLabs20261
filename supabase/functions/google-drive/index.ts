import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// deno-lint-ignore no-explicit-any
async function refreshTokenIfNeeded(
  supabase: any,
  userId: string,
  integration: { access_token_encrypted: string; refresh_token_encrypted: string; token_expires_at: string }
) {
  const expiresAt = new Date(integration.token_expires_at);
  const now = new Date();
  
  if (expiresAt > now) {
    return integration.access_token_encrypted;
  }

  console.log('[Drive] Token expired, refreshing...');
  
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token_encrypted,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  
  await supabase
    .from('user_integrations')
    .update({
      access_token_encrypted: data.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .eq('is_connected', true)
      .single();

    if (!integration) {
      return new Response(
        JSON.stringify({ error: 'Google Drive not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await refreshTokenIfNeeded(supabase, user.id, integration);
    const { action, query, fileId, folderId, maxResults = 10 } = await req.json();

    console.log(`[Drive] Action: ${action}, Query: ${query}`);

    let result;

    switch (action) {
      case 'search': {
        // Search files in Drive
        let searchQuery = query ? `name contains '${query}'` : '';
        if (folderId) {
          searchQuery = searchQuery ? `${searchQuery} and '${folderId}' in parents` : `'${folderId}' in parents`;
        }
        
        const params = new URLSearchParams({
          q: searchQuery || 'trashed = false',
          pageSize: maxResults.toString(),
          fields: 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,iconLink)',
          orderBy: 'modifiedTime desc',
        });

        const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Drive API error');
        }

        result = {
          success: true,
          data: {
            files: data.files || [],
            count: data.files?.length || 0,
          },
        };
        break;
      }

      case 'get': {
        // Get file metadata and content
        if (!fileId) {
          throw new Error('fileId is required for get action');
        }

        const metaResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const meta = await metaResponse.json();
        
        if (!metaResponse.ok) {
          throw new Error(meta.error?.message || 'Failed to get file');
        }

        // For Google Docs, get content as plain text
        let content = null;
        if (meta.mimeType?.startsWith('application/vnd.google-apps')) {
          const exportMime = meta.mimeType.includes('document') ? 'text/plain' : 
                           meta.mimeType.includes('spreadsheet') ? 'text/csv' : null;
          
          if (exportMime) {
            const contentResponse = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            
            if (contentResponse.ok) {
              content = await contentResponse.text();
              // Limit content size for AI processing
              if (content.length > 10000) {
                content = content.substring(0, 10000) + '\n... [contenido truncado]';
              }
            }
          }
        }

        result = {
          success: true,
          data: { ...meta, content },
        };
        break;
      }

      case 'list_folders': {
        const params = new URLSearchParams({
          q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
          pageSize: maxResults.toString(),
          fields: 'files(id,name,createdTime)',
          orderBy: 'name',
        });

        const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Drive API error');
        }

        result = {
          success: true,
          data: { folders: data.files || [] },
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[Drive] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
