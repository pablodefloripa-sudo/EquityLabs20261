import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Building2,
  Calendar,
  CheckCircle2,
  Crown,
  DollarSign,
  FileSpreadsheet,
  Gem,
  Globe,
  HardDrive,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getSubscriptionPageCopy } from '@/components/landing/siteCopy';
import { getLandingLang } from '@/components/landing/landingContent';

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
  name: string;
  price: string;
  cadence: string;
  agentLimit: string;
  modelRouting: string;
  summary: string;
  badge: string;
  accent: string;
  icon: LucideIcon;
  checkoutUrl?: string;
  spotlight?: boolean;
  features: string[];
  productFit: string[];
};

type UserPlanPayload = {
  user_id: string;
  plan: SubscriptionPlanKey;
  status: 'active' | 'requested';
  start_date: string;
  end_date: string | null;
};

const plans: PlanDefinition[] = [
  {
    key: 'FREE_30_DAYS',
    tier: 'FREE',
    displayPlan: 'FREE 30 DAYS',
    name: 'Trial operativo',
    price: '$0',
    cadence: '30 dias',
    agentLimit: '3',
    modelRouting: 'Routing base con modelos gratuitos y control de costo.',
    summary: 'Ideal para probar el dashboard, los agentes y el chat sin tocar la capa comercial.',
    badge: 'Start here',
    accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    icon: Zap,
    features: [
      '3 agentes activos',
      'Chat con routing gratuito',
      'Dashboard con contexto y proyectos',
      'Límite diario gratuito controlado desde backend',
    ],
    productFit: [
      'Validación de uso real',
      'Onboarding de usuarios nuevos',
      'Prueba de integración con el dashboard',
    ],
  },
  {
    key: 'TACTICAL_25',
    tier: 'TACTICAL',
    displayPlan: 'TACTICAL $25',
    name: 'Ejecución diaria',
    price: '$25',
    cadence: '/mes',
    agentLimit: '5',
    modelRouting: 'Routing táctico para agentes de operación.',
    summary: 'Para equipos chicos que quieren más capacidad de ejecución sin complejidad enterprise.',
    badge: 'Most efficient',
    accent: 'from-cyan-400 via-sky-400 to-blue-500',
    icon: Target,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_TACTICAL,
    features: [
      '5 agentes activos',
      'Mejor routing en el chat y en la mesa de trabajo',
      'Ideal para tareas repetibles y seguimiento',
      'Primer upgrade natural desde el trial',
    ],
    productFit: [
      'Freelancers y founders',
      'Operaciones semanales',
      'Uso continuo con bajo costo',
    ],
  },
  {
    key: 'PREMIUM_50',
    tier: 'PREMIUM',
    displayPlan: 'PREMIUM $50',
    name: 'Capa principal',
    price: '$50',
    cadence: '/mes',
    agentLimit: '6',
    modelRouting: 'Routing premium para trabajo más profundo y mejor calidad.',
    summary: 'El plan más equilibrado para usar EquityLabs como copiloto serio de trabajo diario.',
    badge: 'Best balance',
    accent: 'from-fuchsia-400 via-violet-400 to-cyan-400',
    icon: BrainCircuit,
    spotlight: true,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_PREMIUM,
    features: [
      '6 agentes activos',
      'Acceso a modelos premium en el backend',
      'Mejor desempeño para análisis, escritura y revisión',
      'Encaja con el dashboard operativo actual',
    ],
    productFit: [
      'Operación profesional',
      'Uso frecuente del chat',
      'Trabajo con integraciones Google',
    ],
  },
  {
    key: 'MASTERMIND_100',
    tier: 'MASTERMIND',
    displayPlan: 'MASTERMIND $100',
    name: 'Razonamiento avanzado',
    price: '$100',
    cadence: '/mes',
    agentLimit: '8',
    modelRouting: 'Routing avanzado para decisiones de alto impacto.',
    summary: 'Pensado para cuando el producto deja de ser copiloto y pasa a ser sistema de decisión.',
    badge: 'Advanced',
    accent: 'from-amber-300 via-orange-400 to-rose-400',
    icon: Crown,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_MASTERMIND,
    features: [
      '8 agentes activos',
      'Mejor cobertura de reasoning y revisión',
      'Más holgura para flujos complejos',
      'Preparado para trabajo estratégico',
    ],
    productFit: [
      'Equipos de alta exigencia',
      'Rutas con más iteración',
      'Análisis y dirección estratégica',
    ],
  },
  {
    key: 'ENTERPRISE_500',
    tier: 'ENTERPRISE',
    displayPlan: 'ENTERPRISE $500',
    name: 'Escala operativa',
    price: '$500',
    cadence: '/mes',
    agentLimit: '8',
    modelRouting: 'Routing enterprise para operaciones amplias.',
    summary: 'Para equipos que quieren mover procesos, no solo conversaciones.',
    badge: 'Scale',
    accent: 'from-slate-200 via-cyan-300 to-sky-500',
    icon: Building2,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_ENTERPRISE,
    features: [
      '8 agentes activos',
      'Capa enterprise para flujos más pesados',
      'Pensado para equipos y automatización avanzada',
      'Ajustado al backend de routing existente',
    ],
    productFit: [
      'Operaciones grandes',
      'Múltiples usuarios',
      'Automatización y soporte interno',
    ],
  },
  {
    key: 'ALLIANCE_1000',
    tier: 'ALLIANCE',
    displayPlan: 'ALLIANCE $1000',
    name: 'Partner tier',
    price: '$1000',
    cadence: '/mes',
    agentLimit: '8+',
    modelRouting: 'Routing partner con modelos exclusivos.',
    summary: 'La capa más alta para clientes estratégicos y despliegues especiales.',
    badge: 'Partner',
    accent: 'from-emerald-300 via-lime-300 to-cyan-300',
    icon: Globe,
    checkoutUrl: import.meta.env.VITE_STRIPE_CHECKOUT_ALLIANCE,
    features: [
      '8+ agentes activos',
      'Acceso a modelos exclusivos en backend',
      'Pensado para acuerdos estratégicos',
      'Nivel máximo de personalización comercial',
    ],
    productFit: [
      'Partnerships',
      'Clientes estratégicos',
      'Expansión con soporte premium',
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

const persistSubscriptionContext = (plan: PlanDefinition) => {
  localStorage.setItem(
    'eq_subscription_context',
    JSON.stringify({
      key: plan.key,
      tier: plan.tier,
      displayPlan: plan.displayPlan,
      agentLimit: plan.agentLimit,
      modelRouting: plan.modelRouting,
      selectedAt: new Date().toISOString(),
    }),
  );
};

const featureIcons = {
  agents: Users,
  models: Sparkles,
  google: Mail,
  workspace: HardDrive,
  calendar: Calendar,
  sheets: FileSpreadsheet,
};

const Suscripciones = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [submittedPlan, setSubmittedPlan] = useState<string | null>(null);
  const siteLang = getLandingLang();
  const copy = getSubscriptionPageCopy(siteLang);

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
      persistSubscriptionContext(plan);

      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);

      if (plan.key === 'FREE_30_DAYS') {
        endDate.setDate(endDate.getDate() + 30);
      }

      const planPayload: UserPlanPayload = {
        user_id: user.id,
        plan: plan.key,
        status: plan.key === 'FREE_30_DAYS' ? 'active' : 'requested',
        start_date: startDate.toISOString(),
        end_date: plan.key === 'FREE_30_DAYS' ? endDate.toISOString() : null,
      };

      const { error } = await supabase
        .from('user_planes' as never)
        .upsert(planPayload as never, { onConflict: 'user_id' });

      if (error) {
        console.error('Error al guardar el plan:', error);
        toast.error('No pudimos guardar la seleccion del plan.');
        return;
      }

      setSubmittedPlan(plan.key);

      if (plan.key === 'FREE_30_DAYS') {
        toast.success('Trial operativo activado por 30 dias.');
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
        <img src="/slides/base.jpg" alt="" aria-hidden className="h-full w-full object-cover opacity-35" />
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

            <button
              onClick={() => navigate(isAuthenticated ? '/' : '/auth')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              {isAuthenticated ? 'Abrir dashboard' : 'Iniciar sesion'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12 pt-12">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
              <span className="subscription-shimmer-border rounded-full bg-fuchsia-400/8 px-3 py-1 text-cyan-200">{copy.heroBadge}</span>
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-cyan-200 text-glow-sm md:text-6xl">
              {copy.heroTitle}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-white/72 md:text-lg">
              {copy.heroDescription}
            </p>
          </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">{copy.sectionAgents}</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{copy.statAgents}</p>
              <p className="mt-1 text-sm text-white/70">{copy.statAgentsDetail}</p>
            </div>
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">{copy.sectionRouting}</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{copy.statModels}</p>
              <p className="mt-1 text-sm text-white/70">{copy.statModelsDetail}</p>
            </div>
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">{copy.sectionWorkspace}</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{copy.statWorkspace}</p>
              <p className="mt-1 text-sm text-white/70">{copy.statWorkspaceDetail}</p>
            </div>
            <div className="subscription-mini-panel pb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">{copy.sectionCheckout}</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-200">{copy.statCheckout}</p>
              <p className="mt-1 text-sm text-white/70">{copy.statCheckoutDetail}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="subscription-shimmer-border overflow-hidden rounded-2xl bg-black/35 backdrop-blur-xl">
            <div className="grid gap-4 border-b border-cyan-300/15 p-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: featureIcons.agents, title: copy.sectionAgents, text: copy.sectionAgentsDetail },
                { icon: featureIcons.models, title: copy.sectionRouting, text: copy.sectionRoutingDetail },
                { icon: featureIcons.google, title: copy.sectionWorkspace, text: copy.sectionWorkspaceDetail },
                { icon: featureIcons.workspace, title: copy.sectionProjects, text: copy.sectionProjectsDetail },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-3 text-sm font-semibold text-cyan-200">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Planes</p>
              <h2 className="mt-2 text-3xl font-semibold text-cyan-200 text-glow-sm">{copy.plansTitle}</h2>
            </div>
            <div className="subscription-shimmer-border hidden items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm text-white/75 lg:flex">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              Guarda el contexto del plan y actualiza la capa operativa.
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
                    <span className="text-5xl font-semibold text-cyan-200">{plan.agentLimit}</span>
                    <span className="pb-1 text-base font-medium text-amber-200">agentes</span>
                    <span className="ml-auto pb-1 text-base font-medium text-white/82">
                      {plan.price} {plan.cadence}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
                      {plan.badge}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-3 py-1 text-sm font-semibold text-white">
                      {plan.tier}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl border border-cyan-300/15 bg-white/4 px-4 py-3">
                    <p className="text-sm uppercase tracking-[0.22em] text-amber-300">Lo que desbloquea</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...plan.features, ...plan.productFit].map((feature) => (
                        <span key={feature} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/86">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-cyan-100">{plan.modelRouting}</p>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm font-medium leading-6 text-white/88">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
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
                        : plan.key === 'FREE_30_DAYS'
                          ? 'Activar trial'
                          : 'Ir a Stripe'}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                      {isSpotlight && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-fuchsia-200/90">
                      <Gem className="h-4 w-4" />
                      {copy.spotlightDescription}
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
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300">{copy.summaryBadge}</p>
              <h3 className="mt-3 text-3xl font-semibold text-cyan-200">{copy.summaryTitle}</h3>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
                {copy.summaryBody}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-white/10 bg-white/4 p-4">
                <Rocket className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-sm font-semibold text-cyan-200">{copy.trialCardTitle}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{copy.trialCardBody}</p>
              </div>
              <div className="border border-white/10 bg-white/4 p-4">
                <DollarSign className="h-5 w-5 text-fuchsia-300" />
                <p className="mt-3 text-sm font-semibold text-cyan-200">{copy.paidCardTitle}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{copy.paidCardBody}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Suscripciones;
