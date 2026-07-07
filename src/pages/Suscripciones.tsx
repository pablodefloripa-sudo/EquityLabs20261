import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Building2,
  Crown,
  Gem,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type SubscriptionPlanKey =
  | 'FREE_30_DAYS'
  | 'TACTICAL_25'
  | 'PREMIUM_50'
  | 'MASTERMIND_100'
  | 'ENTERPRISE_500'
  | 'ALLIANCE_1000';

type PlanDefinition = {
  key: SubscriptionPlanKey;
  tier: string;
  displayPlan: string;
  agents: string;
  models: string[];
  exclusiveModels?: string[];
  price: string;
  cadence: string;
  name: string;
  idealFor: string;
  juicy: string;
  summary: string;
  buttonLabel: string;
  checkoutUrl?: string;
  badge: string;
  accent: string;
  icon: LucideIcon;
  spotlight?: boolean;
  features: string[];
};

const plans: PlanDefinition[] = [
  {
    key: 'FREE_30_DAYS',
    tier: 'FREE',
    displayPlan: 'FREE',
    agents: '3',
    models: ['DeepSeek R1', 'Gemini-2.5-Flash-Lite', 'Llama-3.3-70B', 'Qwen2.5-7B', 'GPT-4o-Mini'],
    price: '$0',
    cadence: '30 dias',
    name: 'Sovereign Trial',
    idealFor: 'Quienes quieren probar el poder real',
    juicy: '3 agentes con modelos gratuitos y costo operativo controlado.',
    summary: 'Entrada gratuita para probar conectividad IA real sin tocar rutas comerciales de API.',
    buttonLabel: 'Activar 30 dias',
    badge: 'Launch Point',
    accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    icon: Zap,
    features: [
      '3 agentes activos',
      'DeepSeek R1, Gemini Flash Lite, Llama 70B, Qwen 7B y GPT-4o Mini',
      'Control de costo obligatorio para mantener consumo en cero',
      'Limite gratuito con respuesta limpia si se excede',
    ],
  },
  {
    key: 'TACTICAL_25',
    tier: 'TACTICAL',
    displayPlan: 'Tactical $25',
    agents: '5',
    models: ['Gemini-2.5-Flash', 'Claude-3.5-Haiku', 'Mistral-Large', 'Grok-2', 'DeepSeek-V3', 'NVIDIA Nemotron-4'],
    price: '$25',
    cadence: '/mes',
    name: 'Tactical Operator',
    idealFor: 'Emprendedores jovenes y freelancers',
    juicy: '5 agentes con modelos tacticos para ejecucion diaria.',
    summary: 'Conectividad seria para operar rapido, con modelos eficientes y control de presupuesto.',
    buttonLabel: 'Pagar Tactical en Stripe',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_TACTICAL,
    badge: 'Efficient',
    accent: 'from-cyan-400 via-sky-400 to-blue-500',
    icon: Target,
    features: [
      '5 agentes activos',
      'Gemini Flash, Claude Haiku, Mistral Large, Grok-2 y DeepSeek-V3',
      'NVIDIA Nemotron-4 para tareas especializadas',
      'Conectividad mensual de baja friccion',
    ],
  },
  {
    key: 'PREMIUM_50',
    tier: 'PREMIUM',
    displayPlan: 'Premium $50',
    agents: '6',
    models: ['Claude-3.5-Sonnet', 'Gemini-2.5-Pro', 'GPT-4o', 'Qwen2.5-72B', 'Command-R+', 'Snowflake Arctic'],
    price: '$50',
    cadence: '/mes',
    name: 'Cognitive Premium',
    idealFor: 'Profesionales y emprendedores serios',
    juicy: '6 agentes y modelos premium para trabajo profundo.',
    summary: 'El punto dulce de conectividad: potencia, precision y variedad sin subir a operacion enterprise.',
    buttonLabel: 'Pagar Premium en Stripe',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_PREMIUM,
    badge: 'Most Chosen',
    accent: 'from-fuchsia-400 via-violet-400 to-cyan-400',
    icon: BrainCircuit,
    spotlight: true,
    features: [
      '6 agentes activos',
      'Claude Sonnet, Gemini Pro y GPT-4o',
      'Qwen 72B, Command-R+ y Snowflake Arctic',
      'Balance fuerte entre costo, profundidad y velocidad',
    ],
  },
  {
    key: 'MASTERMIND_100',
    tier: 'MASTERMIND',
    displayPlan: 'Mastermind $100',
    agents: '8',
    models: ['Claude-4-Sonnet', 'o1-mini', 'Grok-3', 'Llama-4-405B', 'NVIDIA Llama-3.1-Nemotron', 'DBRX', 'Phi-4'],
    price: '$100',
    cadence: '/mes',
    name: 'Mastermind Sovereign',
    idealFor: 'Alto rendimiento y vision',
    juicy: '8 agentes con modelos de razonamiento avanzado.',
    summary: 'Capa de alto rendimiento para vision, estrategia y ejecucion con modelos de frontera.',
    buttonLabel: 'Pagar Mastermind en Stripe',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_MASTERMIND,
    badge: 'Elite',
    accent: 'from-amber-300 via-orange-400 to-rose-400',
    icon: Crown,
    features: [
      '8 agentes activos',
      'Claude 4 Sonnet, o1-mini, Grok-3 y Llama-4-405B',
      'Nemotron, DBRX y Phi-4 para arquitectura y revision',
      'Pensado para decisiones exigentes y trabajo de alto nivel',
    ],
  },
  {
    key: 'ENTERPRISE_500',
    tier: 'ENTERPRISE',
    displayPlan: 'Enterprise $500',
    agents: '8',
    models: ['Claude-4-Opus', 'o1', 'Gemini-2.5-Pro-Preview', 'GPT-4.5-Preview', 'Perplexity-Sonar', 'NVIDIA Nemotron-70B'],
    price: '$500',
    cadence: '/mes',
    name: 'Autonomous Enterprise',
    idealFor: 'Empresas y operaciones grandes',
    juicy: '8 agentes enterprise para operaciones grandes.',
    summary: 'Conectividad de escala para procesos, equipos y automatizacion con modelos de mayor capacidad.',
    buttonLabel: 'Pagar Enterprise en Stripe',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_ENTERPRISE,
    badge: 'Ops Scale',
    accent: 'from-slate-200 via-cyan-300 to-sky-500',
    icon: Building2,
    features: [
      '8 agentes activos',
      'Claude Opus, o1, Gemini Pro Preview y GPT-4.5 Preview',
      'Perplexity Sonar y NVIDIA Nemotron-70B',
      'Preparado para operaciones grandes y automatizacion avanzada',
    ],
  },
  {
    key: 'ALLIANCE_1000',
    tier: 'ALLIANCE',
    displayPlan: 'Alliance $1000',
    agents: '8+',
    models: ['Todos los anteriores'],
    exclusiveModels: ['Recursal-32B', 'MythoMax', 'Dolphin-2.9', 'Command-R+ extended', 'NVIDIA Cosmos experimental'],
    price: '$1000',
    cadence: '/mes',
    name: 'Global Alliance',
    idealFor: 'Socios estrategicos y expansion regional',
    juicy: '8+ agentes y acceso a modelos raros/exclusivos.',
    summary: 'La capa partner: todos los modelos anteriores mas conectividad experimental para expansion.',
    buttonLabel: 'Pagar Alliance en Stripe',
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_ALLIANCE,
    badge: 'Partner Tier',
    accent: 'from-emerald-300 via-lime-300 to-cyan-300',
    icon: Network,
    features: [
      '8+ agentes activos',
      'Todos los modelos anteriores',
      'Recursal-32B, MythoMax, Dolphin-2.9 y Command-R+ extended',
      'NVIDIA Cosmos experimental para exploracion avanzada',
    ],
  },
];

const accentGlow: Record<SubscriptionPlanKey, string> = {
  FREE_30_DAYS: 'shadow-[0_0_45px_rgba(16,185,129,0.18)]',
  TACTICAL_25: 'shadow-[0_0_45px_rgba(56,189,248,0.18)]',
  PREMIUM_50: 'shadow-[0_0_55px_rgba(217,70,239,0.22)]',
  MASTERMIND_100: 'shadow-[0_0_45px_rgba(251,146,60,0.18)]',
  ENTERPRISE_500: 'shadow-[0_0_45px_rgba(148,163,184,0.18)]',
  ALLIANCE_1000: 'shadow-[0_0_45px_rgba(132,204,22,0.18)]',
};

const Suscripciones = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [submittedPlan, setSubmittedPlan] = useState<string | null>(null);

  const spotlightPlan = useMemo(() => location.hash.replace('#', ''), [location.hash]);

  useEffect(() => {
    if (!spotlightPlan) return;

    const timeout = window.setTimeout(() => {
      document.getElementById(spotlightPlan)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [spotlightPlan]);

  const handleSelectPlan = async (plan: PlanDefinition) => {
    try {
      setLoading(plan.key);

      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);

      if (plan.key === 'FREE_30_DAYS') {
        endDate.setDate(endDate.getDate() + 30);
      }

      const { error } = await supabase
        .from('user_planes' as any)
        .upsert(
          {
            user_id: user.id,
            plan: plan.key,
            status: plan.key === 'FREE_30_DAYS' ? 'active' : 'requested',
            start_date: startDate.toISOString(),
            end_date: plan.key === 'FREE_30_DAYS' ? endDate.toISOString() : null,
          } as any,
          { onConflict: 'user_id' },
        );

      if (error) {
        console.error('Error al guardar el plan:', error);
        toast.error('No pudimos guardar la seleccion del plan.');
        return;
      }

      setSubmittedPlan(plan.key);

      if (plan.key === 'FREE_30_DAYS') {
        toast.success('Sovereign Trial activado por 30 dias.');
        navigate('/');
        return;
      }

      if (!plan.checkoutUrl) {
        toast.error(`Falta configurar el link de Stripe para ${plan.name}.`);
        return;
      }

      toast.success(`Redirigiendo a Stripe para ${plan.name}.`);
      window.location.assign(plan.checkoutUrl);
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Paso algo inesperado al guardar la solicitud.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0">
        <img
          src="/slides/base.jpg"
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.82),rgba(2,6,23,0.96))]" />
        <div className="subscription-float subscription-float-a" />
        <div className="subscription-float subscription-float-b" />
        <div className="subscription-float subscription-float-c" />
      </div>

      <div className="relative z-10">
        <section className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <button
              onClick={() => navigate('/landing')}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-black/35 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al landing
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs text-white/70 md:block">
                {isAuthenticated ? 'Sesion iniciada: listo para activar' : 'Inicia sesion para activar cualquier plan'}
              </div>
              <button
                onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                {isAuthenticated ? 'Abrir dashboard' : 'Iniciar sesion'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-14 pt-12">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
              <span className="subscription-shimmer-border rounded-full bg-fuchsia-400/8 px-3 py-1 text-cyan-200">Subscription Architecture</span>
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-cyan-200 text-glow-sm md:text-6xl">
              Planes de Conectividad
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-white/72 md:text-lg">
              Conectividad por nivel: agentes asignados, modelos disponibles y acceso progresivo a opciones
              tacticas, premium, enterprise y experimentales.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">FREE</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">3 agentes</p>
              <p className="mt-1 text-sm text-white/70">Modelos base con ruta gratuita controlada.</p>
            </div>
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Premium</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">20+ opciones</p>
              <p className="mt-1 text-sm text-white/70">Claude, Gemini, GPT, Qwen, Command y Arctic.</p>
            </div>
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Enterprise</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">8 agentes</p>
              <p className="mt-1 text-sm text-white/70">Modelos preview y razonamiento para escala.</p>
            </div>
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Alliance</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">8+ agentes</p>
              <p className="mt-1 text-sm text-white/70">Todos los anteriores mas modelos raros.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="subscription-shimmer-border overflow-hidden rounded-2xl bg-black/35 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-cyan-300/20 bg-white/5 text-xs uppercase tracking-[0.22em] text-amber-300">
                  <tr>
                    <th className="px-5 py-4 font-medium">Plan</th>
                    <th className="px-5 py-4 font-medium">Agentes</th>
                    <th className="px-5 py-4 font-medium">Modelos Disponibles (20+ opciones)</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <tr key={plan.key} className="border-b border-white/6 transition hover:bg-cyan-300/5 last:border-b-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-xl bg-gradient-to-br p-[1px] ${plan.accent}`}>
                              <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-slate-950 text-white">
                                <Icon className="h-5 w-5" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-cyan-200">{plan.displayPlan}</p>
                              <p className="text-xs text-amber-200/80">{plan.badge}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-2xl font-semibold text-cyan-200">{plan.agents}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex max-w-4xl flex-wrap gap-2">
                            {plan.models.map((model) => (
                              <span key={model} className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-sm text-white/90">
                                {model}
                              </span>
                            ))}
                            {plan.exclusiveModels?.map((model) => (
                              <span key={model} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
                                {model}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Planes detallados</p>
              <h2 className="mt-2 text-3xl font-semibold text-cyan-200 text-glow-sm">Conectividad por capacidad, modelos y agentes</h2>
            </div>
            <div className="subscription-shimmer-border hidden items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm text-white/75 lg:flex">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              Seleccionas plan, guardamos la senal y activamos la ruta de modelos.
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSpotlight = plan.spotlight;
              const isHashTarget = spotlightPlan === plan.key;
              const isSubmitted = submittedPlan === plan.key;

              return (
                <article
                  key={plan.key}
                  id={plan.key}
                  className={[
                    'subscription-card-float group relative overflow-hidden rounded-2xl bg-black/45 p-6 backdrop-blur-xl transition duration-300 scroll-mt-24',
                    'subscription-shimmer-border',
                    isSpotlight ? 'border-fuchsia-400/45' : 'border-white/10',
                    isHashTarget ? 'ring-2 ring-cyan-300/60' : '',
                    accentGlow[plan.key] || '',
                  ].join(' ')}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${plan.accent}`} />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-amber-300">{plan.displayPlan}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-cyan-200">{plan.name}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/78">{plan.summary}</p>
                    </div>

                    <div className={`rounded-2xl bg-gradient-to-br p-[1px] ${plan.accent}`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-slate-950 text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-5xl font-semibold text-cyan-200">{plan.agents}</span>
                    <span className="pb-1 text-base font-medium text-amber-200">agentes</span>
                    <span className="ml-auto pb-1 text-base font-medium text-white/82">{plan.price} {plan.cadence}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
                      {plan.badge}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-3 py-1 text-sm font-semibold text-white">
                      {plan.idealFor}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl border border-cyan-300/15 bg-white/4 px-4 py-3">
                    <p className="text-sm uppercase tracking-[0.22em] text-amber-300">Modelos disponibles</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...plan.models, ...(plan.exclusiveModels || [])].map((model) => (
                        <span key={model} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/86">
                          {model}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-cyan-100">{plan.juicy}</p>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm font-medium leading-6 text-white/88">
                        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loading === plan.key}
                    className={[
                      'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
                      isSpotlight
                        ? 'border-fuchsia-400/50 bg-fuchsia-400/14 text-white hover:bg-fuchsia-400/18'
                        : 'border-cyan-400/35 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/16',
                      loading === plan.key ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    {loading === plan.key
                      ? 'Guardando...'
                      : isSubmitted
                        ? 'Solicitud guardada'
                        : plan.buttonLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {isSpotlight && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-fuchsia-200/90">
                      <Gem className="h-4 w-4" />
                      Punto dulce de conectividad: potencia premium sin complejidad enterprise.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-t border-white/10 bg-black/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Cierre operativo</p>
              <h3 className="mt-3 text-3xl font-semibold text-cyan-200">Mas agentes, mas modelos, mejor conectividad</h3>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
                FREE prueba la ruta base. Tactical suma ejecucion. Premium abre modelos serios.
                Mastermind sube razonamiento. Enterprise escala operaciones. Alliance desbloquea
                todos los anteriores y modelos raros para expansion.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 bg-white/4 p-4">
                <Rocket className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-sm font-semibold text-cyan-200">FREE controlado</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  3 agentes, modelos base y limite gratuito con respuesta limpia.
                </p>
              </div>
              <div className="border border-white/10 bg-white/4 p-4">
                <Crown className="h-5 w-5 text-fuchsia-300" />
                <p className="mt-3 text-sm font-semibold text-cyan-200">Alliance experimental</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Todos los modelos anteriores mas Recursal, MythoMax, Dolphin y Cosmos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Suscripciones;
