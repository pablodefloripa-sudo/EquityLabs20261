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

  console.log('[Sheets] Token expired, refreshing...');
  
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
        JSON.stringify({ error: 'Google Sheets not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await refreshTokenIfNeeded(supabase, user.id, integration);
    const { action, spreadsheetId, range, values } = await req.json();

    console.log(`[Sheets] Action: ${action}, SpreadsheetId: ${spreadsheetId}`);

    let result;

    switch (action) {
      case 'read': {
        if (!spreadsheetId) {
          throw new Error('spreadsheetId is required');
        }

        const rangeParam = range || 'A1:Z1000';
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeParam)}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Sheets API error');
        }

        result = {
          success: true,
          data: {
            range: data.range,
            values: data.values || [],
            rowCount: data.values?.length || 0,
          },
        };
        break;
      }

      case 'write': {
        if (!spreadsheetId || !range || !values) {
          throw new Error('spreadsheetId, range, and values are required');
        }

        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values }),
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Sheets API error');
        }

        result = {
          success: true,
          data: {
            updatedRange: data.updatedRange,
            updatedRows: data.updatedRows,
            updatedColumns: data.updatedColumns,
            updatedCells: data.updatedCells,
          },
        };
        break;
      }

      case 'append': {
        if (!spreadsheetId || !range || !values) {
          throw new Error('spreadsheetId, range, and values are required');
        }

        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values }),
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Sheets API error');
        }

        result = {
          success: true,
          data: {
            updatedRange: data.updates?.updatedRange,
            updatedRows: data.updates?.updatedRows,
          },
        };
        break;
      }

      case 'get_metadata': {
        if (!spreadsheetId) {
          throw new Error('spreadsheetId is required');
        }

        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties,sheets.properties`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Sheets API error');
        }

        result = {
          success: true,
          data: {
            title: data.properties?.title,
            sheets: data.sheets?.map((s: { properties: { sheetId: number; title: string; index: number } }) => ({
              id: s.properties.sheetId,
              title: s.properties.title,
              index: s.properties.index,
            })) || [],
          },
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
    console.error('[Sheets] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
