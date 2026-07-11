import type { LandingLang } from './LanguageFloater';

export type LandingPlanCopy = {
  freeLabel: string;
  paidLabel: string;
  freeCta: string;
  upgradeCta: string;
  freeHighlights: Array<{ title: string; detail: string }>;
  paidHighlights: string[];
};

export type SubscriptionPageCopy = {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  statAgents: string;
  statModels: string;
  statWorkspace: string;
  statCheckout: string;
  statAgentsDetail: string;
  statModelsDetail: string;
  statWorkspaceDetail: string;
  statCheckoutDetail: string;
  sectionAgents: string;
  sectionRouting: string;
  sectionWorkspace: string;
  sectionCheckout: string;
  sectionProjects: string;
  sectionAgentsDetail: string;
  sectionRoutingDetail: string;
  sectionWorkspaceDetail: string;
  sectionProjectsDetail: string;
  plansTitle: string;
  spotlightTitle: string;
  spotlightDescription: string;
  summaryBadge: string;
  summaryTitle: string;
  summaryBody: string;
  trialCardTitle: string;
  trialCardBody: string;
  paidCardTitle: string;
  paidCardBody: string;
};

const landingPlanCopyByLang: Partial<Record<LandingLang, LandingPlanCopy>> = {
  en: {
    freeLabel: 'SOVEREIGN TRIAL',
    paidLabel: '2026 UPGRADE PATH',
    freeCta: 'Explore free trial',
    upgradeCta: 'View 2026 plans',
    freeHighlights: [
      { title: 'Multi-agent access', detail: 'Several agents work on one objective.' },
      { title: 'Strategic north', detail: 'We define the real direction before scaling.' },
      { title: 'Final roadmap', detail: 'You leave with a next-step plan, not just prompts.' },
    ],
    paidHighlights: ['$25 Tactical', '$50 Premium', '$100 Mastermind'],
  },
  es: {
    freeLabel: 'TRIAL SOBERANO',
    paidLabel: 'RUTA DE UPGRADE 2026',
    freeCta: 'Explorar trial gratis',
    upgradeCta: 'Ver planes 2026',
    freeHighlights: [
      { title: 'Multiagente', detail: 'Varios agentes empujan un mismo objetivo.' },
      { title: 'Norte estrategico', detail: 'Definimos direccion real antes de escalar.' },
      { title: 'Hoja de ruta final', detail: 'Te llevas el siguiente paso, no solo prompts.' },
    ],
    paidHighlights: ['$25 Tactical', '$50 Premium', '$100 Mastermind'],
  },
};

const subscriptionPageCopyByLang: Partial<Record<LandingLang, SubscriptionPageCopy>> = {
  en: {
    heroBadge: 'Product-aligned pricing',
    heroTitle: 'Subscriptions aligned to the real product',
    heroDescription:
      'This grid reflects what exists today: agent limits, plan-based model routing, operational dashboard, Google Workspace on demand, and Stripe checkout for paid tiers.',
    statAgents: '3 to 8+',
    statModels: 'Real routing',
    statWorkspace: 'Google',
    statCheckout: 'Stripe',
    statAgentsDetail: 'The limit increases according to the plan stored in `user_planes`.',
    statModelsDetail: 'The backend function resolves the model by plan and agent.',
    statWorkspaceDetail: 'Gmail, Drive, Sheets and Calendar activate on demand.',
    statCheckoutDetail: 'Paid plans redirect to the Stripe link configured by environment.',
    sectionAgents: 'Agents',
    sectionRouting: 'Routing',
    sectionWorkspace: 'Google Workspace',
    sectionCheckout: 'Checkout',
    sectionProjects: 'Projects',
    sectionAgentsDetail: 'The dashboard already works with agent selection, bunker and task operator.',
    sectionRoutingDetail: 'The backend resolves models by plan and operational role.',
    sectionWorkspaceDetail: 'Gmail, Drive, Sheets and Calendar connect under consent.',
    sectionProjectsDetail: 'The task operator and communication area capture context and metrics.',
    plansTitle: 'From trial to alliance',
    spotlightTitle: 'The sweet spot',
    spotlightDescription: 'Better balance between capacity and cost for the current product.',
    summaryBadge: 'Product summary',
    summaryTitle: 'Commercial now matches technical reality',
    summaryBody:
      'Pricing now describes the real system: agent limits, plan-based routing, Google integrations under consent, and Stripe checkout for paid tiers. That reduces friction and makes the sale clearer.',
    trialCardTitle: 'Trial',
    trialCardBody: 'Use it to validate value, not just to look at a demo.',
    paidCardTitle: 'Paid plans',
    paidCardBody: 'Tactical, Premium, Mastermind, Enterprise and Alliance are ready for Stripe.',
  },
  es: {
    heroBadge: 'Pricing alineado al producto',
    heroTitle: 'Suscripciones alineadas al producto real',
    heroDescription:
      'Esta grilla refleja lo que ya existe hoy: límite de agentes, routing de modelos por plan, dashboard operativo, Google Workspace bajo demanda y checkout por Stripe para los planes pagos.',
    statAgents: '3 a 8+',
    statModels: 'Routing real',
    statWorkspace: 'Google',
    statCheckout: 'Stripe',
    statAgentsDetail: 'El límite sube según el plan guardado en `user_planes`.',
    statModelsDetail: 'La función backend resuelve el modelo por plan y agente.',
    statWorkspaceDetail: 'Gmail, Drive, Sheets y Calendar se activan bajo demanda.',
    statCheckoutDetail: 'Los planes pagos redirigen al link configurado por entorno.',
    sectionAgents: 'Agentes',
    sectionRouting: 'Routing',
    sectionWorkspace: 'Google Workspace',
    sectionCheckout: 'Checkout',
    sectionProjects: 'Proyectos',
    sectionAgentsDetail: 'El dashboard ya trabaja con selección de agente, bunker y task operator.',
    sectionRoutingDetail: 'El backend resuelve modelos por plan y rol operativo.',
    sectionWorkspaceDetail: 'Gmail, Drive, Sheets y Calendar se conectan bajo consentimiento.',
    sectionProjectsDetail: 'El task operator y la communication area capturan contexto y métricas.',
    plansTitle: 'De trial a alianza',
    spotlightTitle: 'Punto dulce',
    spotlightDescription: 'Mejor relación entre capacidad y costo para el producto actual.',
    summaryBadge: 'Resumen de producto',
    summaryTitle: 'Lo comercial ya coincide con lo técnico',
    summaryBody:
      'El pricing ahora describe el sistema real: límite de agentes, routing por plan, integraciones Google bajo consentimiento y checkout de Stripe para los niveles pagos. Eso reduce fricción y hace más clara la venta.',
    trialCardTitle: 'Trial',
    trialCardBody: 'Sirve para validar valor, no solo para mirar una demo.',
    paidCardTitle: 'Planes pagos',
    paidCardBody: 'Tactical, Premium, Mastermind, Enterprise y Alliance ya están listos para Stripe.',
  },
};

export const getLandingPlanCopy = (lang: LandingLang): LandingPlanCopy => {
  return landingPlanCopyByLang[lang] || landingPlanCopyByLang.en!;
};

export const getSubscriptionPageCopy = (lang: LandingLang): SubscriptionPageCopy => {
  return subscriptionPageCopyByLang[lang] || subscriptionPageCopyByLang.en!;
};
