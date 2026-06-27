import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Model routing - mapped to Lovable AI supported models
const MODELS = {
  greeting: 'google/gemini-2.5-flash-lite',
  default: 'google/gemini-3-flash-preview',
  agents: {
    orquestador: 'google/gemini-3-flash-preview',
    analista: 'google/gemini-2.5-flash',
    escritor: 'google/gemini-2.5-flash',
    investigador: 'google/gemini-2.5-flash',
    desarrollador: 'google/gemini-3-flash-preview',
    disenador: 'google/gemini-2.5-flash',
    revisor: 'google/gemini-2.5-flash',
    asistente: 'google/gemini-2.5-flash-lite',
    architect: 'google/gemini-3-flash-preview',
    logic: 'google/gemini-3-flash-preview',
    recepcionista: 'google/gemini-2.5-flash',
  }
};

// Detect if message is a simple greeting
function isGreeting(message: string): boolean {
  const greetingPatterns = [
    /^hola$/i, /^hi$/i, /^hello$/i, /^hey$/i,
    /^buenos?\s*(días?|tardes?|noches?)$/i,
    /^good\s*(morning|afternoon|evening)$/i,
    /^qué\s*tal$/i, /^cómo\s*estás?$/i, /^saludos?$/i,
  ];
  return greetingPatterns.some(pattern => pattern.test(message.trim()));
}

interface AvailableTools {
  gmail: boolean;
  drive: boolean;
  sheets: boolean;
  calendar: boolean;
}

async function checkGoogleIntegrations(supabaseUrl: string, supabaseKey: string, userId: string): Promise<AvailableTools> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('provider, is_connected')
    .eq('user_id', userId)
    .in('provider', ['gmail', 'drive', 'calendar', 'sheets']);
  
  const result: AvailableTools = { gmail: false, drive: false, sheets: false, calendar: false };
  
  if (integrations) {
    for (const row of integrations) {
      if (row.is_connected && row.provider in result) {
        result[row.provider as keyof AvailableTools] = true;
      }
    }
  }
  
  return result;
}

function formatAvailableTools(tools: AvailableTools): string {
  const available: string[] = [];
  if (tools.gmail) available.push('Gmail (leer/enviar correos)');
  if (tools.drive) available.push('Drive (buscar/leer archivos)');
  if (tools.sheets) available.push('Sheets (leer/escribir datos)');
  if (tools.calendar) available.push('Calendar (ver/crear eventos)');
  
  if (available.length === 0) return '';
  return `\n\n**Herramientas activas:** ${available.join(', ')}`;
}

interface EmailIntent {
  type: 'send' | 'read' | null;
  to?: string;
  subject?: string;
  body?: string;
  query?: string;
  personName?: string;
}

function detectEmailIntent(message: string): EmailIntent {
  const lowerMsg = message.toLowerCase();
  
  const sendPatterns = [
    /mand[aáe]\s*(un\s*)?(email|correo|mail)/i,
    /envi[aáe]\s*(un\s*)?(email|correo|mail)/i,
    /escrib[eíi]\s*(un\s*)?(email|correo|mail)/i,
    /enviar\s*(email|correo|mail)/i,
    /mandar\s*(email|correo|mail)/i,
  ];
  
  const readPatterns = [
    /qu[eé]\s*(me\s*)?(respondió|contesto|dijo|escribió)/i,
    /respuesta\s*de/i,
    /emails?\s*(de|recibidos?)/i,
    /correos?\s*(de|recibidos?)/i,
    /revisar?\s*(mis\s*)?(emails?|correos?)/i,
    /leer\s*(mis\s*)?(emails?|correos?)/i,
    /mensajes?\s*de/i,
  ];
  
  if (sendPatterns.some(p => p.test(lowerMsg))) {
    const toMatch = message.match(/a\s+(\S+@\S+\.\S+)/i) || 
                    message.match(/para\s+(\S+@\S+\.\S+)/i);
    const personMatch = message.match(/a\s+mi\s+(\w+)/i) ||
                        message.match(/a\s+(\w+)/i);
    
    return {
      type: 'send',
      to: toMatch?.[1],
      personName: personMatch?.[1],
    };
  }
  
  if (readPatterns.some(p => p.test(lowerMsg))) {
    const personMatch = message.match(/(?:de|respondió|contesto)\s+(\w+)/i);
    
    return {
      type: 'read',
      personName: personMatch?.[1],
      query: personMatch ? `from:${personMatch[1]}` : 'in:inbox is:unread',
    };
  }
  
  return { type: null };
}

interface DriveIntent {
  type: 'search' | 'get' | null;
  query?: string;
  fileId?: string;
}

function detectDriveIntent(message: string): DriveIntent {
  const lowerMsg = message.toLowerCase();
  
  const searchPatterns = [
    /busca(r)?\s*(en\s*)?(drive|archivos?|documentos?)/i,
    /encontra(r)?\s*(en\s*)?(drive|archivos?)/i,
    /qu[eé]\s*archivos?\s*(tengo|hay)/i,
    /archivos?\s*(de|sobre|relacionados?)/i,
  ];
  
  if (searchPatterns.some(p => p.test(lowerMsg))) {
    const queryMatch = message.match(/(?:sobre|de|llamado|titulado)\s+["']?([^"']+)["']?/i) ||
                       message.match(/buscar?\s+["']?([^"']+)["']?\s+en/i);
    return {
      type: 'search',
      query: queryMatch?.[1] || message.replace(/buscar?\s*(en\s*)?(drive|archivos?|documentos?)/i, '').trim(),
    };
  }
  
  return { type: null };
}

interface SheetsIntent {
  type: 'read' | 'write' | null;
  spreadsheetId?: string;
  range?: string;
  query?: string;
}

function detectSheetsIntent(message: string): SheetsIntent {
  const lowerMsg = message.toLowerCase();
  
  const readPatterns = [
    /datos?\s*(de|en)\s*(la\s*)?(hoja|planilla|sheet|excel)/i,
    /leer\s*(la\s*)?(hoja|planilla|sheet)/i,
    /qu[eé]\s*(hay|dice)\s*(en|la)\s*(hoja|planilla)/i,
  ];
  
  if (readPatterns.some(p => p.test(lowerMsg))) {
    const urlMatch = message.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return {
      type: 'read',
      spreadsheetId: urlMatch?.[1],
      query: message,
    };
  }
  
  return { type: null };
}

interface CalendarIntent {
  type: 'list' | 'create' | null;
  summary?: string;
  startTime?: string;
  endTime?: string;
}

function detectCalendarIntent(message: string): CalendarIntent {
  const lowerMsg = message.toLowerCase();
  
  const listPatterns = [
    /qu[eé]\s*(eventos?|reuniones?|citas?)\s*(tengo|hay)/i,
    /mi\s*agenda/i,
    /calendario/i,
    /próxim[oa]s?\s*(eventos?|reuniones?)/i,
  ];
  
  const createPatterns = [
    /crea(r)?\s*(un\s*)?(evento|reunión|cita)/i,
    /agenda(r)?\s*(una?\s*)?(reunión|cita|llamada)/i,
    /programa(r)?\s*(una?\s*)?(reunión|cita)/i,
  ];
  
  if (listPatterns.some(p => p.test(lowerMsg))) {
    return { type: 'list' };
  }
  
  if (createPatterns.some(p => p.test(lowerMsg))) {
    const summaryMatch = message.match(/(?:llamada|reunión|evento)\s+(?:con|sobre|para)\s+["']?([^"']+)["']?/i);
    return {
      type: 'create',
      summary: summaryMatch?.[1],
    };
  }
  
  return { type: null };
}

async function callGoogleFunction(
  supabaseUrl: string,
  authToken: string,
  functionName: string,
  params: Record<string, unknown>
) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  return response.json();
}

// Helper to call AI Gateway
async function callAI(apiKey: string, model: string, messages: { role: string; content: string }[], maxTokens = 500) {
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  const responseText = await response.text();
  console.log(`[EQuityLabs] AI Gateway response status: ${response.status}`);

  if (!response.ok) {
    console.error('[EQuityLabs] AI Gateway error:', responseText);
    
    if (response.status === 429) {
      return { error: 'Rate limit exceeded. Please try again later.', status: 429 };
    }
    if (response.status === 402) {
      return { error: 'AI credits exhausted. Please add funds in Settings → Workspace → Usage.', status: 402 };
    }
    
    let errorMessage = `AI Gateway error ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // use default
    }
    return { error: errorMessage, status: response.status };
  }

  try {
    const data = JSON.parse(responseText);
    return { data, status: 200 };
  } catch {
    return { error: 'Invalid response format from AI', status: 500 };
  }
}

serve(async (req) => {
  console.log('[EQuityLabs] AI Chat via Lovable AI Gateway');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, agentId, language } = await req.json();
    const langMap: Record<string, string> = {
      es: 'español', en: 'English', pt: 'português', de: 'Deutsch',
      it: 'italiano', fr: 'français', zh: '中文', ja: '日本語'
    };
    const responseLang = langMap[language] || langMap['es'];

    if (!message) {
      throw new Error('Message is required');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      console.error('CRITICAL: LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authToken: string = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user } } = await supabase.auth.getUser(authToken);
    const userId: string | null = user?.id || null;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let availableTools: AvailableTools = { gmail: false, drive: false, sheets: false, calendar: false };
    let userDisplayName = 'Admin';

    {
      
      if (userId) {
        availableTools = await checkGoogleIntegrations(supabaseUrl, supabaseKey, userId);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', userId)
          .single();
        
        if (profile?.display_name) {
          userDisplayName = profile.display_name;
        }
      }
    }

    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;
    const isSimpleGreeting = isGreeting(message);

    // Handle contextual greeting with available tools
    if (isFirstMessage && isSimpleGreeting && userId) {
      const toolsList = formatAvailableTools(availableTools);
      const greetingWithTools = toolsList 
        ? `¡Hola ${userDisplayName}! 👋\n\nVeo que tengo acceso a tus integraciones:${toolsList}\n\n¿En qué trabajamos hoy?`
        : `¡Hola ${userDisplayName}! 👋\n\nEstoy listo para ayudarte. Aún no tienes integraciones de Google activas. ¿Quieres conectar Gmail, Drive, Sheets o Calendar?`;
      
      const modelUsed = MODELS.agents.orquestador;
      
      return new Response(
        JSON.stringify({ 
          response: greetingWithTools,
          meta: { model: modelUsed, route: 'greeting_with_tools', availableTools }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect tool intents
    const emailIntent = detectEmailIntent(message);
    const driveIntent = detectDriveIntent(message);
    const sheetsIntent = detectSheetsIntent(message);
    const calendarIntent = detectCalendarIntent(message);

    // Handle Drive actions
    if (driveIntent.type && availableTools.drive && authToken) {
      console.log(`[EQuityLabs] Drive intent: ${driveIntent.type}`);
      
      const result = await callGoogleFunction(supabaseUrl, authToken, 'google-drive', {
        action: driveIntent.type,
        query: driveIntent.query,
        fileId: driveIntent.fileId,
        maxResults: 10,
      });
      
      if (result.error) {
        return new Response(
          JSON.stringify({ response: `❌ Error al acceder a Drive: ${result.error}`, meta: { action: 'drive_error', model: MODELS.agents.architect } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const filesContext = result.data?.files?.map((f: { name: string; mimeType: string; modifiedTime: string; webViewLink: string }) => 
        `📄 ${f.name} (${f.mimeType.split('.').pop()})\n   Modificado: ${new Date(f.modifiedTime).toLocaleDateString('es')}\n   Link: ${f.webViewLink}`
      ).join('\n\n') || 'No se encontraron archivos';

      const aiResult = await callAI(apiKey, MODELS.agents.architect, [
        { role: 'system', content: `Eres el agente Architect de EQuityLabs especializado en arquitectura de sistemas. El usuario buscó en Drive y encontró:\n\n${filesContext}\n\nResume los archivos encontrados y ofrece analizar alguno en detalle si es relevante para el proyecto.` },
        { role: 'user', content: message },
      ], 600);

      if (aiResult.error) {
        return new Response(JSON.stringify({ error: aiResult.error }), { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const summary = aiResult.data.choices?.[0]?.message?.content || 'No pude procesar los resultados de Drive.';
      return new Response(
        JSON.stringify({ response: summary, meta: { action: 'drive_search', model: MODELS.agents.architect, fileCount: result.data?.count || 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Sheets actions
    if (sheetsIntent.type && availableTools.sheets && authToken && sheetsIntent.spreadsheetId) {
      console.log(`[EQuityLabs] Sheets intent: ${sheetsIntent.type}`);
      
      const result = await callGoogleFunction(supabaseUrl, authToken, 'google-sheets', {
        action: sheetsIntent.type,
        spreadsheetId: sheetsIntent.spreadsheetId,
        range: sheetsIntent.range || 'A1:Z50',
      });
      
      if (result.error) {
        return new Response(
          JSON.stringify({ response: `❌ Error al acceder a Sheets: ${result.error}`, meta: { action: 'sheets_error', model: MODELS.agents.logic } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sheetsContext = JSON.stringify(result.data?.values?.slice(0, 20) || [], null, 2);
      
      const aiResult = await callAI(apiKey, MODELS.agents.logic, [
        { role: 'system', content: `Eres el agente Logic de EQuityLabs especializado en análisis de datos y cálculos. Datos de la hoja:\n\n\`\`\`json\n${sheetsContext}\n\`\`\`\n\nAnaliza estos datos y responde la pregunta del usuario.` },
        { role: 'user', content: message },
      ], 800);

      if (aiResult.error) {
        return new Response(JSON.stringify({ error: aiResult.error }), { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const analysis = aiResult.data.choices?.[0]?.message?.content || 'No pude analizar los datos.';
      return new Response(
        JSON.stringify({ response: analysis, meta: { action: 'sheets_read', model: MODELS.agents.logic, rowCount: result.data?.rowCount || 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Calendar actions
    if (calendarIntent.type && availableTools.calendar && authToken) {
      console.log(`[EQuityLabs] Calendar intent: ${calendarIntent.type}`);
      
      if (calendarIntent.type === 'list') {
        const result = await callGoogleFunction(supabaseUrl, authToken, 'google-calendar', {
          action: 'list',
          maxResults: 10,
        });
        
        if (result.error) {
          return new Response(
            JSON.stringify({ response: `❌ Error al acceder a Calendar: ${result.error}`, meta: { action: 'calendar_error', model: MODELS.agents.logic } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const eventsContext = result.data?.events?.map((e: { summary: string; start: string; end: string; attendees?: { email: string }[] }) => 
          `📅 **${e.summary}**\n   ${new Date(e.start).toLocaleString('es')} - ${new Date(e.end).toLocaleString('es')}\n   Asistentes: ${e.attendees?.map(a => a.email).join(', ') || 'Solo tú'}`
        ).join('\n\n') || 'No hay eventos próximos';

        return new Response(
          JSON.stringify({ response: `📆 **Tu Agenda**\n\n${eventsContext}`, meta: { action: 'calendar_list', model: MODELS.agents.logic, eventCount: result.data?.count || 0 } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle Gmail actions
    if (emailIntent.type && availableTools.gmail && authToken) {
      console.log(`[EQuityLabs] Email intent: ${emailIntent.type}`);
      
      if (emailIntent.type === 'read') {
        const result = await callGoogleFunction(supabaseUrl, authToken, 'gmail-actions', {
          action: 'read',
          query: emailIntent.query,
          maxResults: 5,
        });
        
        if (result.error) {
          return new Response(
            JSON.stringify({ response: `❌ Error al leer emails: ${result.error}`, meta: { action: 'gmail_read_error', model: MODELS.agents.recepcionista } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const emailContext = result.data?.emails?.map((e: { from: string; subject: string; snippet: string; date: string }) => 
          `De: ${e.from}\nAsunto: ${e.subject}\nFecha: ${e.date}\nPreview: ${e.snippet}`
        ).join('\n---\n') || 'No se encontraron emails';

        const aiResult = await callAI(apiKey, MODELS.agents.recepcionista, [
          { role: 'system', content: `Eres el agente Recepcionista de EQuityLabs. Emails encontrados:\n\n${emailContext}\n\nResume estos emails de forma concisa y profesional.` },
          { role: 'user', content: message },
        ]);

        if (aiResult.error) {
          return new Response(JSON.stringify({ error: aiResult.error }), { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const emailSummary = aiResult.data.choices?.[0]?.message?.content || 'No pude procesar los emails.';
        return new Response(
          JSON.stringify({ response: emailSummary, meta: { action: 'gmail_read', model: MODELS.agents.recepcionista, emailCount: result.data?.count || 0 } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (emailIntent.type === 'send' && emailIntent.to) {
        const result = await callGoogleFunction(supabaseUrl, authToken, 'gmail-actions', {
          action: 'send',
          to: emailIntent.to,
          subject: emailIntent.subject || 'Mensaje desde EQuityLabs',
          body: emailIntent.body || message,
        });

        if (result.success) {
          return new Response(
            JSON.stringify({ response: `✅ **Email enviado**\n\n📬 Destinatario: ${emailIntent.to}\n🆔 ID: \`${result.data.messageId}\``, meta: { action: 'gmail_sent', model: MODELS.agents.recepcionista, messageId: result.data.messageId } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Standard AI chat flow
    let modelToUse: string;
    let routingReason: string;

    if (isFirstMessage && isSimpleGreeting) {
      modelToUse = MODELS.greeting;
      routingReason = 'greeting';
    } else if (agentId && MODELS.agents[agentId as keyof typeof MODELS.agents]) {
      modelToUse = MODELS.agents[agentId as keyof typeof MODELS.agents];
      routingReason = `agent:${agentId}`;
    } else {
      modelToUse = MODELS.default;
      routingReason = 'default';
    }

    console.log(`[EQuityLabs] Routing: ${routingReason} -> Model: ${modelToUse}`);

    const toolsInfo = formatAvailableTools(availableTools);
    const equityLabsContext = `
Eres el asistente principal de EQuityLabs, una plataforma de control de misiones y proyectos de alto rendimiento.

## Tu Identidad
- Nombre: EQuityLabs AI Assistant
- Rol: Asistente ejecutivo para análisis de datos, gestión de proyectos y toma de decisiones estratégicas
- Tono: Profesional, conciso, orientado a resultados

## Capacidades Activas${toolsInfo || '\n- Sin integraciones de Google activas'}

## Agentes Especializados
- **Architect**: Busca en Drive, analiza arquitectura de proyectos
- **Logic**: Lee Sheets, crea eventos en Calendar, cálculos complejos
- **Recepcionista**: Gestiona emails de Gmail

## Reglas
- IDIOMA OBLIGATORIO: Responde SIEMPRE en ${responseLang}, sin excepción.
- FORMATO DE TEXTO: Texto plano y limpio. NO uses asteriscos (*, **), NO uses almohadillas (#, ##, ###), NO uses emoticonos ni emojis. Si necesitas estructurar, usa secciones "Razonamiento:", "Ejecución:" y "Next Step:" en líneas separadas.
- Sé breve y directo (máximo 2-3 párrafos).
- Si te preguntan quién eres, di que eres el asistente de EQuityLabs.
${agentId ? `\n## Modo Agente Activo: ${agentId}` : ''}
`;

    const messages = [
      { role: 'system', content: equityLabsContext },
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ];

    const aiResult = await callAI(apiKey, modelToUse, messages);

    if (aiResult.error) {
      return new Response(
        JSON.stringify({ error: aiResult.error }),
        { status: aiResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assistantMessage = aiResult.data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error('[EQuityLabs] No content in response:', JSON.stringify(aiResult.data));
      return new Response(
        JSON.stringify({ error: 'AI returned empty response.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        meta: {
          model: modelToUse,
          route: routingReason,
          availableTools,
          usage: aiResult.data.usage || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[EQuityLabs] Critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
