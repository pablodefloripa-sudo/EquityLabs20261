import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type AnswerMap = Record<string, string>;

type DiagnosticResult = {
  norteEstrategico: string;
  diagnostico: {
    fortalezas: string[];
    riesgos: string[];
    oportunidades: string[];
  };
  plan: string[];
  meta?: {
    source: "ai" | "rules";
    provider?: "google" | "openrouter" | "gateway";
    model?: string;
    note?: string;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GOOGLE_MODEL = Deno.env.get("FREE_GOOGLE_MODEL") || "gemini-2.5-flash-lite";
const OPENROUTER_MODEL = "~openai/gpt-latest";
const GATEWAY_MODEL = "google/gemini-2.5-pro";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toSentence = (value: string) => value.trim().replace(/\s+/g, " ");

const stripCodeFence = (value: string) =>
  value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

const numberPlanSteps = (steps: string[]) =>
  steps.map((step, index) => `${index + 1}. ${step.replace(/^\d+\.\s*/, "").trim()}`);

const pickStage = (answers: AnswerMap) => {
  const combined = normalize(Object.values(answers).join(" "));

  if (/(mvp|validar|lanzar|primeros clientes|go to market|landing|oferta)/.test(combined)) {
    return "validation";
  }

  if (/(escalar|expansion|crecer|ventas|pipeline|automatiz)/.test(combined)) {
    return "growth";
  }

  if (/(equipo|operacion|procesos|soporte|eficiencia|sistema)/.test(combined)) {
    return "operations";
  }

  return "focus";
};

const buildRulesDiagnostic = (answers: AnswerMap): DiagnosticResult => {
  const combined = normalize(Object.values(answers).join(" "));
  const stage = pickStage(answers);
  const hasBudget = Boolean(answers.presupuesto?.trim());
  const hasDeadline = Boolean(answers.plazo?.trim());
  const hasMetrics = Boolean(answers.metricas?.trim());
  const hasDifferentiation = Boolean(answers.competencia?.trim());
  const hasAudience = Boolean(answers.audiencia?.trim());
  const obstacleText = toSentence(answers.obstaculo || "");
  const resourcesText = toSentence(answers.recursos || "");

  const northByStage: Record<string, string> = {
    validation:
      "Validar demanda con una oferta concreta, un experimento comercial corto y una metrica de conversion visible antes de ampliar alcance.",
    growth:
      "Convertir el objetivo en un sistema de crecimiento repetible, con foco en pipeline, conversion y capacidad operativa sostenible.",
    operations:
      "Ordenar operacion, roles y procesos para que el crecimiento no dependa de esfuerzo manual descoordinado.",
    focus:
      "Traducir la vision del proyecto a una prioridad de 90 dias, una metrica lider y una primera decision comercial medible.",
  };

  const strengths = [
    answers.identidad?.trim()
      ? `La identidad del proyecto ya esta definida: ${toSentence(answers.identidad)}.`
      : "Ya existe suficiente contexto para tomar una primera decision de foco.",
    answers.objetivo90?.trim()
      ? `Hay un objetivo declarado para 90 dias: ${toSentence(answers.objetivo90)}.`
      : "Todavia hay margen para afinar el objetivo principal sin frenar el avance.",
    hasAudience
      ? `La audiencia ya esta identificada: ${toSentence(answers.audiencia)}.`
      : "Aun sin una audiencia cerrada, el problema central ya permite empezar a segmentar.",
    resourcesText
      ? `Existen recursos explicitados para ejecutar: ${resourcesText}.`
      : "La voluntad de ejecucion esta presente aunque falte inventariar recursos con precision.",
  ].slice(0, 3);

  const risks = [
    hasBudget
      ? "El presupuesto ya esta visible, pero conviene asignarlo por hitos y no por intuicion."
      : "Falta definir presupuesto de prueba y margen de error para evitar decisiones ciegas.",
    hasDeadline
      ? `La fecha o hito presiona el plan y exige foco real: ${toSentence(answers.plazo)}.`
      : "Sin una fecha limite clara, el proyecto corre riesgo de diluir prioridad y velocidad.",
    obstacleText
      ? `El principal cuello de botella actual aparece en: ${obstacleText}.`
      : "Todavia falta describir con mas precision el bloqueo principal de ejecucion.",
    hasMetrics
      ? "Ya hay sensibilidad por medicion, pero hace falta elegir una sola metrica lider."
      : "Sin metricas claras sera dificil decidir que conservar, corregir o frenar.",
  ].slice(0, 3);

  const opportunities = [
    answers.problema?.trim()
      ? `La oportunidad nace de un problema concreto que ya esta verbalizado: ${toSentence(answers.problema)}.`
      : "Hay espacio para convertir el problema central en una propuesta mas concreta y vendible.",
    hasDifferentiation
      ? `Ya existe una pista de posicionamiento frente a competencia: ${toSentence(answers.competencia)}.`
      : "Mapear competencia y diferenciacion puede mejorar rapido el mensaje comercial.",
    stage === "growth"
      ? "Se puede priorizar el canal o proceso que ya muestra mas traccion y eliminar dispersion."
      : "Un experimento pequeno con usuarios reales puede dar aprendizaje valioso en pocos dias.",
  ];

  const plan = [
    "Convertir el objetivo de 90 dias en una sola metrica lider y una meta concreta.",
    stage === "validation"
      ? "Disenar una oferta minima y probarla con usuarios o prospectos reales esta misma semana."
      : "Elegir el frente de trabajo mas rentable y congelar tareas que no muevan la prioridad principal.",
    hasAudience
      ? `Construir un mensaje para ${toSentence(answers.audiencia)} y contrastarlo con evidencia real.`
      : "Definir un segmento inicial de cliente y testear el mensaje con conversaciones o trafico real.",
    hasBudget
      ? "Asignar presupuesto por hitos semanales para aprender rapido sin sobredimensionar el esfuerzo."
      : "Definir un presupuesto de prueba pequeno y medir el retorno antes de escalar inversion.",
  ];

  if (!hasMetrics) {
    plan.push("5. Crear un tablero minimo con conversion, tiempo y feedback para revisar avances cada semana.");
  }

  if (combined.includes("equipo") || combined.includes("socios")) {
    plan.push("6. Alinear responsables, cadencia y criterio de decision para que el avance no dependa de conversaciones sueltas.");
  }

  return {
    norteEstrategico: northByStage[stage],
    diagnostico: {
      fortalezas: strengths,
      riesgos: risks,
      oportunidades: opportunities,
    },
    plan: numberPlanSteps(plan),
  };
};

const isDiagnosticResult = (value: unknown): value is DiagnosticResult => {
  if (!value || typeof value !== "object") return false;

  const result = value as DiagnosticResult;
  return (
    typeof result.norteEstrategico === "string" &&
    Array.isArray(result.plan) &&
    Array.isArray(result.diagnostico?.fortalezas) &&
    Array.isArray(result.diagnostico?.riesgos) &&
    Array.isArray(result.diagnostico?.oportunidades)
  );
};

const buildPrompt = (answers: AnswerMap, baseResult: DiagnosticResult) => {
  const formattedAnswers = Object.entries(answers)
    .map(([key, value]) => `- ${key}: ${toSentence(value)}`)
    .join("\n");

  return `
Eres un estratega senior de negocios.

Convierte estas respuestas en un diagnostico ejecutivo claro, accionable y breve.
Debes responder SOLO JSON valido con este schema:
{
  "norteEstrategico": "string",
  "diagnostico": {
    "fortalezas": ["string", "string", "string"],
    "riesgos": ["string", "string", "string"],
    "oportunidades": ["string", "string", "string"]
  },
  "plan": ["string", "string", "string", "string"]
}

Reglas:
- Responde en espanol.
- Cada item debe ser una sola frase.
- No uses markdown, backticks ni texto fuera del JSON.
- El plan debe ser concreto y estar priorizado.
- Si una respuesta del usuario es vaga, completa con criterio estrategico razonable sin inventar datos especificos.

Respuesta base por reglas para tomar como piso de calidad:
${JSON.stringify(baseResult, null, 2)}

Respuestas del usuario:
${formattedAnswers}
`.trim();
};

const parseModelResult = (content: string): DiagnosticResult | null => {
  try {
    const parsed = JSON.parse(stripCodeFence(content));
    return isDiagnosticResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const generateWithGoogle = async (
  prompt: string,
): Promise<{ result: DiagnosticResult; provider: "google"; model: string } | null> => {
  const apiKey = Deno.env.get("GOOGLE_FREE_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) return null;

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: GOOGLE_MODEL,
    generationConfig: {
      maxOutputTokens: 1600,
      temperature: 0.5,
      responseMimeType: "application/json",
    },
  });

  const response = await model.generateContent(prompt);
  const content = response.response.text();
  const parsed = parseModelResult(content);
  if (!parsed) {
    throw new Error("Google devolvio un formato invalido para diagnostico.");
  }

  return { result: parsed, provider: "google", model: GOOGLE_MODEL };
};

const generateWithOpenRouter = async (
  prompt: string,
): Promise<{ result: DiagnosticResult; provider: "openrouter"; model: string } | null> => {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return null;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": "EQuityLabs Diagnostico",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.4,
      max_tokens: 1600,
      messages: [
        {
          role: "system",
          content:
            "Responde solo JSON valido. No uses markdown, explicaciones ni texto extra.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `OpenRouter error ${response.status}`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content || "";
  const parsed = parseModelResult(content);
  if (!parsed) {
    throw new Error("OpenRouter devolvio un formato invalido para diagnostico.");
  }

  return { result: parsed, provider: "openrouter", model: OPENROUTER_MODEL };
};

const generateWithGateway = async (
  prompt: string,
): Promise<{ result: DiagnosticResult; provider: "gateway"; model: string } | null> => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GATEWAY_MODEL,
      temperature: 0.4,
      max_tokens: 1600,
      messages: [
        {
          role: "system",
          content:
            "Responde solo JSON valido. No uses markdown, explicaciones ni texto extra.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `AI gateway error ${response.status}`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content || "";
  const parsed = parseModelResult(content);
  if (!parsed) {
    throw new Error("Gateway devolvio un formato invalido para diagnostico.");
  }

  return { result: parsed, provider: "gateway", model: GATEWAY_MODEL };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as { respuestas?: AnswerMap };
    const answers = body?.respuestas;

    if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
      return new Response(JSON.stringify({ error: "Debes enviar respuestas validas." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rulesResult = buildRulesDiagnostic(answers);
    const prompt = buildPrompt(answers, rulesResult);

    try {
      const googleResponse = await generateWithGoogle(prompt);
      if (googleResponse) {
        return new Response(
          JSON.stringify({
            ...googleResponse.result,
            meta: {
              source: "ai",
              provider: googleResponse.provider,
              model: googleResponse.model,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const openRouterResponse = await generateWithOpenRouter(prompt);
      if (openRouterResponse) {
        return new Response(
          JSON.stringify({
            ...openRouterResponse.result,
            meta: {
              source: "ai",
              provider: openRouterResponse.provider,
              model: openRouterResponse.model,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const gatewayResponse = await generateWithGateway(prompt);
      if (gatewayResponse) {
        return new Response(
          JSON.stringify({
            ...gatewayResponse.result,
            meta: {
              source: "ai",
              provider: gatewayResponse.provider,
              model: gatewayResponse.model,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } catch (aiError) {
      console.error("[diagnostico] AI enrichment failed, using rules fallback:", aiError);
    }

    return new Response(
      JSON.stringify({
        ...rulesResult,
        meta: {
          source: "rules",
          note: "AI no disponible o no configurada. Se uso el motor estrategico base.",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[diagnostico] unexpected error:", error);

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
