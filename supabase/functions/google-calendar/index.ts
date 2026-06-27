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

  console.log('[Calendar] Token expired, refreshing...');
  
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
        JSON.stringify({ error: 'Google Calendar not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await refreshTokenIfNeeded(supabase, user.id, integration);
    const { action, calendarId = 'primary', eventId, event, timeMin, timeMax, maxResults = 10 } = await req.json();

    console.log(`[Calendar] Action: ${action}`);

    let result;

    switch (action) {
      case 'list': {
        // List upcoming events
        const params = new URLSearchParams({
          maxResults: maxResults.toString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          timeMin: timeMin || new Date().toISOString(),
        });
        
        if (timeMax) {
          params.append('timeMax', timeMax);
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Calendar API error');
        }

        result = {
          success: true,
          data: {
            events: data.items?.map((e: { id: string; summary: string; description?: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; htmlLink: string; attendees?: { email: string; responseStatus: string }[] }) => ({
              id: e.id,
              summary: e.summary,
              description: e.description,
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              link: e.htmlLink,
              attendees: e.attendees?.map(a => ({ email: a.email, status: a.responseStatus })),
            })) || [],
            count: data.items?.length || 0,
          },
        };
        break;
      }

      case 'create': {
        if (!event || !event.summary || !event.start || !event.end) {
          throw new Error('event with summary, start, and end is required');
        }

        const eventBody = {
          summary: event.summary,
          description: event.description || '',
          start: {
            dateTime: event.start,
            timeZone: event.timeZone || 'America/Argentina/Buenos_Aires',
          },
          end: {
            dateTime: event.end,
            timeZone: event.timeZone || 'America/Argentina/Buenos_Aires',
          },
          attendees: event.attendees?.map((email: string) => ({ email })) || [],
          reminders: {
            useDefault: true,
          },
        };

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to create event');
        }

        result = {
          success: true,
          data: {
            id: data.id,
            summary: data.summary,
            start: data.start?.dateTime || data.start?.date,
            end: data.end?.dateTime || data.end?.date,
            link: data.htmlLink,
          },
        };
        break;
      }

      case 'delete': {
        if (!eventId) {
          throw new Error('eventId is required');
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=all`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );

        if (!response.ok && response.status !== 204) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to delete event');
        }

        result = {
          success: true,
          data: { deleted: eventId },
        };
        break;
      }

      case 'get': {
        if (!eventId) {
          throw new Error('eventId is required');
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to get event');
        }

        result = {
          success: true,
          data: {
            id: data.id,
            summary: data.summary,
            description: data.description,
            start: data.start?.dateTime || data.start?.date,
            end: data.end?.dateTime || data.end?.date,
            link: data.htmlLink,
            attendees: data.attendees?.map((a: { email: string; responseStatus: string }) => ({ 
              email: a.email, 
              status: a.responseStatus 
            })),
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
    console.error('[Calendar] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
