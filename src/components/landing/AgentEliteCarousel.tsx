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
import { resolveLandingLang } from './landingContent';
import { getLandingPlanCopy } from './siteCopy';

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
  CAREER: 'from-cyan-400/20 to-cyan-500/10 text-cyan-200 border-cyan-300/35',
  ENTREPRENEURSHIP: 'from-yellow-400/20 to-yellow-500/10 text-yellow-200 border-yellow-300/35',
  BUSINESS: 'from-emerald-400/20 to-emerald-500/10 text-emerald-200 border-emerald-300/35',
  LIFESTYLE: 'from-red-400/20 to-red-500/10 text-red-200 border-red-300/35',
  WELLNESS: 'from-red-400/20 to-yellow-400/10 text-red-200 border-red-300/35',
};

const accentCards = [
  {
    border: 'border-emerald-300/25',
    bg: 'bg-emerald-300/10',
    title: 'text-emerald-200',
    body: 'text-emerald-50/68',
  },
  {
    border: 'border-yellow-300/25',
    bg: 'bg-yellow-300/10',
    title: 'text-yellow-200',
    body: 'text-yellow-50/68',
  },
  {
    border: 'border-red-300/25',
    bg: 'bg-red-300/10',
    title: 'text-red-200',
    body: 'text-red-50/68',
  },
];

interface Props {
  lang: LandingLang;
  visualScale: number;
}

const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';

type Agent = {
  id: string | number;
  numId?: string | number;
  badge: string;
  name: Record<string, string>;
  mission: Record<string, string>;
  freeModels?: string[];
  proModels?: string[];
  freeTasks?: Record<string, string[]>;
  proTasks?: Record<string, string[]>;
};

export const AgentEliteCarousel = ({ lang, visualScale }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const agents = data.agents as Agent[];
  const activeLang = resolveLandingLang(lang);
  const phrases = (data.heroPhrase as Record<string, string[]>)[activeLang] || data.heroPhrase.en;
  const ui = (data.ui as Record<string, Record<string, string>>)[activeLang] || data.ui.en;
  const planCopy = getLandingPlanCopy(activeLang);
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
    const agent = agents[activeIndex];
    const name = (agent.name as Record<string, string>)[activeLang] || agent.name.en;
    const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
    const freeTasks = freeTasksMap[activeLang] || freeTasksMap.en || [];
    const persistedAgent = {
      id: String(agent.id),
      name,
      engine: agent.freeModels?.[0] || 'modelo disponible',
      tasks: freeTasks,
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify(persistedAgent));
    navigate('/suscripciones#free');
  };

  const handleUpgrade = () => {
    const agent = agents[activeIndex];
    const name = (agent.name as Record<string, string>)[activeLang] || agent.name.en;
    const proTasksMap = (agent.proTasks || {}) as Record<string, string[]>;
    const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
    const tasks = proTasksMap[activeLang] || proTasksMap.en || freeTasksMap[activeLang] || freeTasksMap.en || [];
    const persistedAgent = {
      id: String(agent.id),
      name,
      engine: agent.proModels?.[0] || agent.freeModels?.[0] || 'modelo disponible',
      tasks,
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify(persistedAgent));
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
  const heroBandHeight = `${Math.max(16, Number((24 - Math.max(0, visualScale - 1) * 10).toFixed(2)))}vh`;
  const heroBandMinHeight = `${Math.max(108, Number((168 - Math.max(0, visualScale - 1) * 86).toFixed(0)))}px`;
  const heroBottomOffset = `${Math.max(8, Number((24 - Math.max(0, visualScale - 1) * 18).toFixed(0)))}px`;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden relative pb-[38px]">
      <div
        className="pointer-events-none relative z-0 flex items-start justify-center"
        style={{
          minHeight: heroBandMinHeight,
          height: heroBandHeight,
          marginBottom: heroBottomOffset,
        }}
      >
        <GhostTyper
          text={phrases[activeIndex % phrases.length]}
          isActive
          visualScale={visualScale}
          key={`${activeIndex}-${activeLang}-${visualScale}`}
        />
      </div>

      <div className="relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <div className="relative flex h-full min-h-[500px] w-full max-w-7xl items-center justify-center">
          <AnimatePresence mode="popLayout">
            {visible.map((idx, pos) => {
              const agent = agents[idx];
              const Icon = agentIcons[idx % agentIcons.length];
              const offset = pos - 2;
              const isCenter = offset === 0;
              const isHovered = hoveredIdx === idx;
              const name = (agent.name as Record<string, string>)[activeLang] || agent.name.en;
              const mission = (agent.mission as Record<string, string>)[activeLang] || agent.mission.en;
              const badge = badgeColors[agent.badge] || badgeColors.LIFESTYLE;
              const freeModels: string[] = agent.freeModels || [];
              const proModels: string[] = agent.proModels || [];
              const freeTasksMap = (agent.freeTasks || {}) as Record<string, string[]>;
              const proTasksMap = (agent.proTasks || {}) as Record<string, string[]>;
              const freeTasks: string[] = freeTasksMap[activeLang] || freeTasksMap.en || [];
              const proTasks: string[] = proTasksMap[activeLang] || proTasksMap.en || [];
              const baseScale = isCenter ? visualScale : 0.56 - Math.abs(offset) * 0.04;
              const finalScale = isHovered ? baseScale * 1.06 : baseScale;

              return (
                <motion.div
                  key={`${agent.id}-${idx}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isCenter || isHovered ? 1 : 0.35 + 0.12 * (2 - Math.abs(offset)),
                    scale: finalScale,
                    x: offset * (isCenter ? 0 : 480),
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
                      'w-[min(92vw,472px)] md:w-[min(95vw,1180px)] overflow-hidden rounded-lg border backdrop-blur-xl transition-all duration-500',
                      isCenter
                        ? 'bg-black/50 border-cyan-400/30'
                        : isHovered
                          ? 'bg-black/50 border-yellow-300/45'
                          : 'bg-black/30 border-white/5',
                    ].join(' ')}
                    style={
                      isCenter
                        ? { boxShadow: '0 0 25px rgba(34,211,238,0.15)' }
                        : isHovered
                          ? { boxShadow: '0 0 34px rgba(250,204,21,0.22)' }
                          : undefined
                    }
                  >
                    <div className="p-4 pb-4 sm:p-5 sm:pb-4">
                      <div className="mb-3 flex items-center gap-3 border-b border-cyan-300/10 pb-3">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                            isCenter ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-300/35' : 'bg-white/5 text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono ${isCenter ? 'text-[15px] md:text-[16px] text-cyan-200/90' : 'text-[11px] text-yellow-200/78'}`}>
                              #{String(agent.numId || idx + 1).padStart(2, '0')}
                            </span>
                            <h3 className={`truncate font-display font-bold ${isCenter ? 'text-[26px] md:text-[30px] text-white' : 'text-[18px] md:text-[1.3rem] text-slate-300/85'}`}>
                              {name}
                            </h3>
                          </div>
                          <span className={`mt-1 inline-block rounded-full border bg-gradient-to-r font-bold uppercase ${isCenter ? 'px-3 py-1 text-[11px] tracking-[0.16em]' : 'px-2.5 py-1 text-[10px]'} ${badge}`}>
                            {agent.badge}
                          </span>
                        </div>
                      </div>

                      <p className={`mb-4 line-clamp-3 ${isCenter ? 'text-[17px] md:text-[19px] leading-[1.38] text-cyan-50/88' : 'text-[14px] md:text-[15px] leading-relaxed text-slate-300/68'}`}>
                        {mission}
                      </p>

                      {isCenter ? (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                          <div className="flex h-full flex-col rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="rounded bg-emerald-300/18 px-3 py-1 text-[16px] md:text-[18px] font-bold tracking-wider text-emerald-100">
                                {planCopy.trialLabel}
                              </span>
                              <span className="rounded-full border border-cyan-300/18 px-3 py-1 text-[16px] md:text-[18px] font-semibold tracking-wide text-cyan-50/90">
                                {planCopy.freeLabel}
                              </span>
                              <span className="truncate font-mono text-[14px] md:text-[15px] text-emerald-50/85">{freeModels.join(' - ')}</span>
                            </div>

                            <ul className="space-y-2.5">
                              {freeTasks.map((task, index) => (
                                <li key={index} className="flex gap-2 text-[16px] md:text-[17px] leading-[1.24] text-emerald-50/90">
                                  <span className="shrink-0 text-cyan-100/90">{'>'}</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-3">
                              {planCopy.freeHighlights.map((item, index) => {
                                const accent = accentCards[index % accentCards.length];
                                return (
                                <div
                                  key={item.title}
                                  className={`flex h-full flex-col rounded-lg border px-3 py-3 ${accent.border} ${accent.bg}`}
                                >
                                  <p className={`text-[13px] md:text-[14px] font-semibold uppercase tracking-[0.12em] ${accent.title}`}>
                                    {item.title}
                                  </p>
                                  <p className={`mt-1.5 text-[13px] md:text-[14px] leading-[1.3] ${accent.body}`}>
                                    {item.detail}
                                  </p>
                                </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex h-full flex-col rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-4">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="rounded bg-cyan-300/18 px-3 py-1 text-[16px] md:text-[18px] font-bold tracking-wider text-cyan-100">
                                {planCopy.paidLabel}
                              </span>
                              <span className="truncate font-mono text-[14px] md:text-[15px] text-cyan-50/90">
                                {proModels.slice(0, 4).join(' - ')}
                                {proModels.length > 4 ? ' ...' : ''}
                              </span>
                            </div>

                            <ul className="grid gap-x-4 gap-y-2 xl:grid-cols-2">
                              {proTasks.map((task, index) => (
                                <li key={index} className="flex gap-2 text-[16px] md:text-[17px] leading-[1.24] text-cyan-50/92">
                                  <span className={index % 4 === 0 ? 'shrink-0 text-cyan-200' : index % 4 === 1 ? 'shrink-0 text-emerald-200' : index % 4 === 2 ? 'shrink-0 text-yellow-200' : 'shrink-0 text-red-200'}>*</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="mt-auto flex flex-wrap gap-2 pt-4">
                              {planCopy.paidHighlights.map((item, index) => (
                                <span
                                  key={item}
                                  className={[
                                    'rounded-md border px-3 py-1.5 text-[14px] md:text-[15px] font-semibold tracking-wide',
                                    index === 0
                                      ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100/90'
                                      : index === 1
                                        ? 'border-yellow-300/25 bg-yellow-300/10 text-yellow-100/90'
                                        : 'border-red-300/25 bg-red-300/10 text-red-100/90',
                                  ].join(' ')}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 opacity-60">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400">{ui.free}</span>
                            <span className="truncate font-mono text-slate-300/72">{freeModels.join(' - ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="rounded bg-cyan-400/20 px-2 py-0.5 font-bold text-cyan-300">{planCopy.paidLabel}</span>
                            <span className="truncate font-mono text-cyan-200/82">{proModels[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:px-5"
                      >
                        <button
                          onClick={handleFree}
                          className="flex-1 rounded-lg border border-emerald-300/40 bg-emerald-300/15 py-3 text-[14px] md:text-[15px] font-bold uppercase tracking-[0.16em] text-emerald-100 transition-all hover:bg-emerald-300/25"
                        >
                          {planCopy.freeCta}
                        </button>
                        <button
                          onClick={handleUpgrade}
                          className="flex-1 rounded-lg border border-cyan-300/70 bg-black/45 py-3 text-[14px] md:text-[15px] font-bold uppercase tracking-[0.16em] text-cyan-100 transition-all hover:border-yellow-200/70 hover:text-yellow-100"
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
