import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Target,
  Briefcase,
  Heart,
  Gem,
  GraduationCap,
  TrendingUp,
  Lightbulb,
  Rocket,
  Award,
  Compass,
  Palette,
  Crown,
  ShoppingBag,
  DollarSign,
  Code,
  Megaphone,
  Search,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GhostTyper } from './GhostTyper';
import type { LandingLang } from './LanguageFloater';
import data from '@/data/lifestyleAgents.json';

const agentIcons = [
  Lightbulb,
  GraduationCap,
  Rocket,
  Palette,
  TrendingUp,
  Target,
  Briefcase,
  DollarSign,
  Shield,
  Gem,
  Heart,
  Award,
  Compass,
  Crown,
  Code,
  Megaphone,
  ShoppingBag,
  Layers,
  Search,
  Shield,
];

const badgeColors: Record<string, string> = {
  CAREER: 'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30',
  ENTREPRENEURSHIP: 'from-amber-500/20 to-orange-600/20 text-amber-400 border-amber-500/30',
  BUSINESS: 'from-emerald-500/20 to-green-600/20 text-emerald-400 border-emerald-500/30',
  LIFESTYLE: 'from-purple-500/20 to-violet-600/20 text-purple-400 border-purple-500/30',
  WELLNESS: 'from-rose-500/20 to-pink-600/20 text-rose-400 border-rose-500/30',
};

type PlanCopy = {
  freeLabel: string;
  paidLabel: string;
  freeCta: string;
  upgradeCta: string;
  freeHighlights: Array<{ title: string; detail: string }>;
  paidHighlights: string[];
};

const planCopyByLang: Partial<Record<LandingLang, PlanCopy>> = {
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
    freeLabel: 'SOVEREIGN TRIAL',
    paidLabel: 'RUTA 2026',
    freeCta: 'Explorar trial gratis',
    upgradeCta: 'Ver planes 2026',
    freeHighlights: [
      { title: 'Multiples agentes', detail: 'Varios agentes empujan el mismo objetivo.' },
      { title: 'Norte estrategico', detail: 'Definimos direccion real antes de escalar.' },
      { title: 'Reporte final', detail: 'Te llevas siguiente paso y recomendaciones claras.' },
    ],
    paidHighlights: ['$25 Tactical', '$50 Premium', '$100 Mastermind'],
  },
};

interface Props {
  lang: LandingLang;
}

export const AgentEliteCarousel = ({ lang }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const agents = data.agents;
  const phrases = (data.heroPhrase as Record<string, string[]>)[lang] || data.heroPhrase.en;
  const ui = (data.ui as Record<string, Record<string, string>>)[lang] || data.ui.en;
  const planCopy = planCopyByLang[lang] || planCopyByLang.en!;
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (hoveredIdx !== null) return;
      setActiveIndex((previous) => (previous + 1) % agents.length);
    }, 6000);
  }, [agents.length, hoveredIdx]);

  useEffect(() => {
    resetAuto();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [resetAuto]);

  const go = (dir: number) => {
    setActiveIndex((previous) => (previous + dir + agents.length) % agents.length);
    resetAuto();
  };

  const handleFree = () => {
    navigate('/suscripciones#free');
  };

  const handleUpgrade = () => {
    navigate('/suscripciones');
  };

  const getVisible = () => {
    const result = [];
    for (let i = -2; i <= 2; i += 1) {
      result.push((activeIndex + i + agents.length) % agents.length);
    }
    return result;
  };

  const visible = getVisible();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden relative">
      <div className="relative z-20 flex min-h-[190px] h-[24vh] items-center justify-center">
        <GhostTyper text={phrases[activeIndex % phrases.length]} isActive key={`${activeIndex}-${lang}`} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative flex h-[640px] w-full max-w-7xl items-center justify-center">
          <AnimatePresence mode="popLayout">
            {visible.map((idx, pos) => {
              const agent = agents[idx] as any;
              const Icon = agentIcons[idx % agentIcons.length];
              const offset = pos - 2;
              const isCenter = offset === 0;
              const isHovered = hoveredIdx === idx;
              const name = (agent.name as Record<string, string>)[lang] || agent.name.en;
              const mission = (agent.mission as Record<string, string>)[lang] || agent.mission.en;
              const badge = badgeColors[agent.badge] || badgeColors.LIFESTYLE;
              const freeModels: string[] = agent.freeModels || [];
              const proModels: string[] = agent.proModels || [];
              const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
              const proTasksMap = (agent.proTasks || {}) as Record<string, string[]>;
              const freeTasks: string[] = freeTasksMap[lang] || freeTasksMap.en || [];
              const proTasks: string[] = proTasksMap[lang] || proTasksMap.en || [];
              const baseScale = isCenter ? 1 : 0.62 - Math.abs(offset) * 0.05;
              const finalScale = isHovered ? baseScale * 1.06 : baseScale;

              return (
                <motion.div
                  key={`${agent.id}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isCenter || isHovered ? 1 : 0.35 + 0.12 * (2 - Math.abs(offset)),
                    scale: finalScale,
                    x: offset * (isCenter ? 0 : 380),
                    zIndex: isHovered ? 40 : isCenter ? 30 : 20 - Math.abs(offset),
                    rotateY: offset * -5,
                  }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className="absolute"
                  style={{ perspective: '1000px' }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div
                    className={[
                      'w-[min(92vw,472px)] md:w-[548px] overflow-hidden rounded-[22px] border-2 backdrop-blur-xl transition-all duration-500',
                      isCenter
                        ? 'bg-black/72 border-cyan-400/60'
                        : isHovered
                          ? 'bg-black/60 border-fuchsia-400/70'
                          : 'bg-black/30 border-white/5',
                    ].join(' ')}
                    style={
                      isCenter
                        ? { boxShadow: '0 0 60px rgba(34,211,238,0.3), inset 0 0 30px rgba(34,211,238,0.05)' }
                        : isHovered
                          ? { boxShadow: '0 0 40px rgba(232,121,249,0.35)' }
                          : undefined
                    }
                  >
                    <div className="p-7 pb-4">
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                            isCenter ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[10px] ${isCenter ? 'text-cyan-400/80' : 'text-[#b49664]/70'}`}>
                              #{String(agent.numId || idx + 1).padStart(2, '0')}
                            </span>
                            <h3 className={`truncate font-display text-[15px] md:text-base font-bold ${isCenter ? 'text-white' : 'text-muted-foreground'}`}>
                              {name}
                            </h3>
                          </div>
                          <span className={`mt-1 inline-block rounded-full border bg-gradient-to-r px-2 py-0.5 text-[9px] font-bold uppercase ${badge}`}>
                            {agent.badge}
                          </span>
                        </div>
                      </div>

                      <p className={`mb-4 line-clamp-2 text-[12px] leading-relaxed ${isCenter ? 'text-white/78' : 'text-muted-foreground/50'}`}>
                        {mission}
                      </p>

                      {isCenter ? (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400">
                                FREE (30 Dias Trial)
                              </span>
                              <span className="rounded-full border border-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-100/85">
                                {planCopy.freeLabel}
                              </span>
                              <span className="truncate font-mono text-[10px] text-emerald-400/70">{freeModels.join(' - ')}</span>
                            </div>

                            <ul className="space-y-1">
                              {freeTasks.map((task, index) => (
                                <li key={index} className="flex gap-1.5 text-[11px] leading-snug text-white/72">
                                  <span className="shrink-0 text-emerald-400/60">{'>'}</span>
                                  <span className="line-clamp-1">{task}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {planCopy.freeHighlights.map((item) => (
                                <div
                                  key={item.title}
                                  className="rounded-lg border border-emerald-500/20 bg-black/20 px-2.5 py-2"
                                >
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                                    {item.title}
                                  </p>
                                  <p className="mt-1 text-[10px] leading-snug text-white/58">
                                    {item.detail}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-300">
                                {planCopy.paidLabel}
                              </span>
                              <span className="truncate font-mono text-[10px] text-cyan-300/80">
                                {proModels.slice(0, 4).join(' - ')}
                                {proModels.length > 4 ? ' ...' : ''}
                              </span>
                            </div>

                            <ul className="space-y-1">
                              {proTasks.map((task, index) => (
                                <li key={index} className="flex gap-1.5 text-[11px] leading-snug text-cyan-100/88">
                                  <span className="shrink-0 text-cyan-300">*</span>
                                  <span className="line-clamp-1">{task}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {planCopy.paidHighlights.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-cyan-100/90"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 opacity-60">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400">{ui.free}</span>
                            <span className="truncate font-mono text-muted-foreground/60">{freeModels.join(' - ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="rounded bg-cyan-400/20 px-2 py-0.5 font-bold text-cyan-300">{planCopy.paidLabel}</span>
                            <span className="truncate font-mono text-cyan-300/70">{proModels[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 px-7 pb-6 sm:flex-row"
                      >
                        <button
                          onClick={handleFree}
                          className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400 transition-all hover:bg-emerald-500/25"
                        >
                          {planCopy.freeCta}
                        </button>
                        <button
                          onClick={handleUpgrade}
                          className="flex-1 rounded-lg border border-cyan-400/70 bg-black py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300 transition-all hover:border-cyan-300 hover:text-cyan-200"
                          style={{ boxShadow: '0 0 18px rgba(34,211,238,0.4), inset 0 0 12px rgba(34,211,238,0.08)' }}
                        >
                          <span className="flex items-center justify-center gap-1">{planCopy.upgradeCta}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <button
            onClick={() => go(-1)}
            className="absolute left-2 md:left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:text-white hover:border-[#b49664]/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 md:right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:text-white hover:border-[#b49664]/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex gap-1.5">
          {agents.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                resetAuto();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
