import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SubscriptionPlanKey =
  | 'FREE_30_DAYS'
  | 'TACTICAL_25'
  | 'PREMIUM_50'
  | 'MASTERMIND_100'
  | 'ENTERPRISE_500'
  | 'ALLIANCE_1000';

export type AgentKey =
  | 'orquestador'
  | 'analista'
  | 'escritor'
  | 'investigador'
  | 'desarrollador'
  | 'disenador'
  | 'revisor'
  | 'asistente'
  | 'architect'
  | 'logic'
  | 'recepcionista';

export interface PlanModelRouting {
  greeting: string;
  default: string;
  agents: Record<AgentKey, string>;
}

export interface UserPlanState {
  plan: SubscriptionPlanKey;
  status: string;
  endDate: string | null;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface AIProviderResult {
  data?: {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
  };
  error?: string;
  status: number;
}

export const PLAN_MODEL_ROUTING: Record<SubscriptionPlanKey, PlanModelRouting> = {
  FREE_30_DAYS: {
    greeting: 'google/gemini-2.5-flash-lite',
    default: 'qwen/qwen2.5-7b',
    agents: {
      orquestador: 'openai/gpt-4o-mini',
      analista: 'meta/llama-3.3-70b',
      escritor: 'qwen/qwen2.5-7b',
      investigador: 'deepseek/deepseek-r1',
      desarrollador: 'openai/gpt-4o-mini',
      disenador: 'google/gemini-2.5-flash-lite',
      revisor: 'meta/llama-3.3-70b',
      asistente: 'google/gemini-2.5-flash-lite',
      architect: 'deepseek/deepseek-r1',
      logic: 'deepseek/deepseek-r1',
      recepcionista: 'openai/gpt-4o-mini',
    },
  },
  TACTICAL_25: {
    greeting: 'google/gemini-2.5-flash',
    default: 'deepseek/deepseek-v3',
    agents: {
      orquestador: 'cognitive/dolphin-2.9',
      analista: 'mistral/mistral-large',
      escritor: 'cognitive/dolphin-2.9',
      investigador: 'xai/grok-2',
      desarrollador: 'anthropic/claude-3.5-haiku',
      disenador: 'nvidia/nemotron-4',
      revisor: 'deepseek/deepseek-v3',
      asistente: 'google/gemini-2.5-flash',
      architect: 'mistral/mistral-large',
      logic: 'deepseek/deepseek-v3',
      recepcionista: 'anthropic/claude-3.5-haiku',
    },
  },
  PREMIUM_50: {
    greeting: 'openai/gpt-4o',
    default: 'google/gemini-2.5-pro',
    agents: {
      orquestador: 'openai/gpt-4o',
      analista: 'anthropic/claude-3.5-sonnet',
      escritor: 'cohere/command-r-plus',
      investigador: 'google/gemini-2.5-pro',
      desarrollador: 'anthropic/claude-3.5-sonnet',
      disenador: 'openai/gpt-4o',
      revisor: 'qwen/qwen2.5-72b',
      asistente: 'microsoft/phi-4',
      architect: 'anthropic/claude-3.5-sonnet',
      logic: 'snowflake/arctic',
      recepcionista: 'microsoft/phi-4',
    },
  },
  MASTERMIND_100: {
    greeting: 'openai/o1-mini',
    default: 'anthropic/claude-4-sonnet',
    agents: {
      orquestador: 'openai/o1-mini',
      analista: 'meta/llama-4-405b',
      escritor: 'gryphe/mythomax',
      investigador: 'xai/grok-3',
      desarrollador: 'anthropic/claude-4-sonnet',
      disenador: 'nvidia/nemotron-70b',
      revisor: 'databricks/dbrx',
      asistente: 'alignment/recursal-32b',
      architect: 'meta/llama-4-405b',
      logic: 'openai/o1-mini',
      recepcionista: 'alignment/recursal-32b',
    },
  },
  ENTERPRISE_500: {
    greeting: 'perplexity/sonar',
    default: 'openai/gpt-4.5-preview',
    agents: {
      orquestador: 'openai/o1',
      analista: 'google/gemini-2.5-pro-preview',
      escritor: 'cognitive/dolphin-2.9.1',
      investigador: 'perplexity/sonar',
      desarrollador: 'anthropic/claude-4-opus',
      disenador: 'nvidia/cosmos',
      revisor: 'openai/o1',
      asistente: 'cognitive/dolphin-2.9.1',
      architect: 'openai/o1',
      logic: 'openai/o1',
      recepcionista: 'perplexity/sonar',
    },
  },
  ALLIANCE_1000: {
    greeting: 'perplexity/sonar',
    default: 'openai/gpt-4.5-preview',
    agents: {
      orquestador: 'openai/o1',
      analista: 'google/gemini-2.5-pro-preview',
      escritor: 'cognitive/dolphin-2.9.3',
      investigador: 'xai/grok-3',
      desarrollador: 'anthropic/claude-4-opus',
      disenador: 'nvidia/cosmos',
      revisor: 'openai/o1',
      asistente: 'cognitive/dolphin-2.9.3',
      architect: 'openai/o1',
      logic: 'openai/o1',
      recepcionista: 'perplexity/sonar',
    },
  },
};

const LEGACY_PLAN_MAP: Record<string, SubscriptionPlanKey> = {
  free: 'FREE_30_DAYS',
  tactical: 'TACTICAL_25',
  premium: 'PREMIUM_50',
  mastermind: 'MASTERMIND_100',
  enterprise: 'ENTERPRISE_500',
  alliance: 'ALLIANCE_1000',
};

export const GOOGLE_FREE_MODEL = Deno.env.get('FREE_GOOGLE_MODEL') || 'gemini-2.5-flash-lite';
const localFreeUsage = new Map<string, { day: string; count: number }>();

export function normalizePlan(plan: string | null | undefined): SubscriptionPlanKey {
  if (!plan) return 'FREE_30_DAYS';
  if (plan in PLAN_MODEL_ROUTING) return plan as SubscriptionPlanKey;
  return LEGACY_PLAN_MAP[plan.toLowerCase()] || 'FREE_30_DAYS';
}

export async function getUserPlanState(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  userId: string,
): Promise<UserPlanState> {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data } = await supabase
    .from('user_planes')
    .select('plan, status, end_date')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    plan: normalizePlan(data?.plan),
    status: data?.status || 'active',
    endDate: data?.end_date || null,
  };
}

export function isFreePlan(plan: SubscriptionPlanKey): boolean {
  return plan === 'FREE_30_DAYS';
}

export function resolveModel(plan: SubscriptionPlanKey, route: 'greeting' | 'default' | AgentKey): string {
  const routing = PLAN_MODEL_ROUTING[plan];
  if (route === 'greeting') return routing.greeting;
  if (route === 'default') return routing.default;
  return routing.agents[route];
}

export async function consumeFreeQuota(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  userId: string,
): Promise<boolean> {
  const limit = Number(Deno.env.get('FREE_AI_DAILY_LIMIT') || '50');
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error } = await supabase.rpc('consume_free_ai_quota', {
    p_user_id: userId,
    p_daily_limit: limit,
  });

  if (error) {
    console.error('[EquityLabs] Free quota RPC failed:', error);
    return consumeLocalFreeQuota(userId, limit);
  }

  return data === true;
}

function consumeLocalFreeQuota(userId: string, limit: number): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const current = localFreeUsage.get(userId);

  if (!current || current.day !== day) {
    localFreeUsage.set(userId, { day, count: 1 });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export async function callPaidGateway(
  gatewayUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens = 500,
): Promise<AIProviderResult> {
  const response = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  if (!response.ok) {
    let errorMessage = `AI Gateway error ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Keep gateway status message.
    }

    if (response.status === 429) {
      return { error: 'Rate limit exceeded. Please try again later.', status: 429 };
    }
    if (response.status === 402) {
      return { error: 'AI credits exhausted. Please add funds in Settings -> Workspace -> Usage.', status: 402 };
    }

    return { error: errorMessage, status: response.status };
  }

  try {
    return { data: JSON.parse(responseText), status: 200 };
  } catch {
    return { error: 'Invalid response format from AI', status: 500 };
  }
}

export async function callFreeGoogleAI(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  userId: string,
  messages: ChatMessage[],
  maxTokens = 500,
): Promise<AIProviderResult> {
  if (!(await consumeFreeQuota(supabaseUrl, supabaseServiceRoleKey, userId))) {
    return {
      error: 'Limite gratuito alcanzado. Intenta nuevamente manana o actualiza tu plan.',
      status: 429,
    };
  }

  const googleFreeApiKey = Deno.env.get('GOOGLE_FREE_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
  if (!googleFreeApiKey) {
    return {
      error: 'El proveedor gratuito de Google no esta configurado para el plan FREE.',
      status: 503,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(googleFreeApiKey);
    const model = genAI.getGenerativeModel({
      model: GOOGLE_FREE_MODEL,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    });
    const system = messages.find((item) => item.role === 'system')?.content || '';
    const transcript = messages
      .filter((item) => item.role !== 'system')
      .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.content}`)
      .join('\n\n');
    const result = await model.generateContent(`${system}\n\n${transcript}`);
    const content = result.response.text();

    return {
      data: { choices: [{ message: { content } }], usage: { provider: 'google-free-tier' } },
      status: 200,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Google free-tier request failed',
      status: 500,
    };
  }
}

export async function callAIWithCostControl(
  params: {
    userId: string;
    plan: SubscriptionPlanKey;
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    gatewayUrl: string;
    paidApiKey: string;
    model: string;
    messages: ChatMessage[];
    maxTokens?: number;
  },
): Promise<AIProviderResult> {
  if (isFreePlan(params.plan)) {
    return callFreeGoogleAI(
      params.supabaseUrl,
      params.supabaseServiceRoleKey,
      params.userId,
      params.messages,
      params.maxTokens,
    );
  }

  return callPaidGateway(
    params.gatewayUrl,
    params.paidApiKey,
    params.model,
    params.messages,
    params.maxTokens,
  );
}
