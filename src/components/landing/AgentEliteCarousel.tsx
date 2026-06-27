import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Shield, Zap, Brain, Target, Briefcase, Heart, Gem, GraduationCap, TrendingUp, Lightbulb, Rocket, Award, Compass, Palette, Crown, Plane, ShoppingBag, DollarSign, Code, Megaphone, Search, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GhostTyper } from './GhostTyper';
import { AgentAdvancedModal } from './AgentAdvancedModal';
import type { LandingLang } from './LanguageFloater';
import data from '@/data/lifestyleAgents.json';
import agentsBg from '@/assets/agents-bg.jpg';

const agentIcons = [
  Lightbulb, GraduationCap, Zap, Palette, Rocket,
  TrendingUp, Target, Briefcase, DollarSign, Shield,
  Gem, Heart, Award, Compass, Crown,
  Code, Megaphone, ShoppingBag, Layers, Search,
];

const badgeColors: Record<string, string> = {
  CAREER: 'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30',
  ENTREPRENEURSHIP: 'from-amber-500/20 to-orange-600/20 text-amber-400 border-amber-500/30',
  BUSINESS: 'from-emerald-500/20 to-green-600/20 text-emerald-400 border-emerald-500/30',
  LIFESTYLE: 'from-purple-500/20 to-violet-600/20 text-purple-400 border-purple-500/30',
  WELLNESS: 'from-rose-500/20 to-pink-600/20 text-rose-400 border-rose-500/30',
};

interface Props {
  lang: LandingLang;
}

export const AgentEliteCarousel = ({ lang }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const agents = data.agents;
  const phrases = (data.heroPhrase as Record<string, string[]>)[lang] || data.heroPhrase.en;
  const ui = (data.ui as Record<string, Record<string, string>>)[lang] || data.ui.en;
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (hoveredIdx !== null) return;
      setActiveIndex(p => (p + 1) % agents.length);
    }, 6000);
  }, [agents.length, hoveredIdx]);

  useEffect(() => {
    resetAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [resetAuto]);

  const go = (dir: number) => {
    setActiveIndex(p => (p + dir + agents.length) % agents.length);
    resetAuto();
  };

  const handleFree = () => {
    navigate('/auth');
  };

  const getVisible = () => {
    const result = [];
    for (let i = -2; i <= 2; i++) {
      result.push((activeIndex + i + agents.length) % agents.length);
    }
    return result;
  };

  const visible = getVisible();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden relative">
      {/* Background is provided by the intro video underneath */}

      {/* Ghost Typer - top 15% */}
      <div className="relative z-20 h-[15vh] flex items-center justify-center">
        <GhostTyper
          text={phrases[activeIndex % phrases.length]}
          isActive={true}
          key={`${activeIndex}-${lang}`}
        />
      </div>

      {/* Carousel area - 85% */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Cards */}
        <div className="relative w-full max-w-7xl h-[640px] flex items-center justify-center">
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
                  key={agent.id + '-' + idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isCenter || isHovered ? 1 : 0.35 + (0.12 * (2 - Math.abs(offset))),
                    scale: finalScale,
                    x: offset * (isCenter ? 0 : 380),
                    zIndex: isHovered ? 40 : (isCenter ? 30 : 20 - Math.abs(offset)),
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
                    className={`
                    w-[480px] md:w-[560px] rounded-2xl overflow-hidden
                    backdrop-blur-xl border-2 transition-all duration-500
                    ${isCenter
                      ? 'bg-black/70 border-cyan-400/60'
                      : isHovered
                        ? 'bg-black/60 border-fuchsia-400/70'
                        : 'bg-black/30 border-white/5'}
                  `}
                    style={isCenter ? { boxShadow: '0 0 60px rgba(34,211,238,0.3), inset 0 0 30px rgba(34,211,238,0.05)' } : isHovered ? { boxShadow: '0 0 40px rgba(232,121,249,0.35)' } : undefined}
                  >
                    {/* Card Header */}
                    <div className="p-7 pb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${isCenter ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 text-muted-foreground'}`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono ${isCenter ? 'text-cyan-400/80' : 'text-[#b49664]/70'}`}>#{String(agent.numId || idx + 1).padStart(2, '0')}</span>
                            <h3 className={`font-display text-lg font-bold truncate ${isCenter ? 'text-white' : 'text-muted-foreground'}`}>
                              {name}
                            </h3>
                          </div>
                          <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border bg-gradient-to-r ${badge}`}>
                            {agent.badge}
                          </span>
                        </div>
                      </div>

                      <p className={`text-sm leading-relaxed mb-4 line-clamp-2 ${isCenter ? 'text-white/80' : 'text-muted-foreground/50'}`}>
                        {mission}
                      </p>

                      {isCenter ? (
                        <div className="space-y-3">
                          {/* FREE block */}
                          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider">FREE (30 Días Trial)</span>
                              <span className="text-emerald-400/70 text-[10px] font-mono truncate">{freeModels.join(' · ')}</span>
                            </div>
                            <ul className="space-y-1">
                              {freeTasks.map((t, i) => (
                                <li key={i} className="text-[12px] text-white/70 leading-snug flex gap-1.5">
                                  <span className="text-emerald-400/60 shrink-0">›</span>
                                  <span className="line-clamp-1">{t}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* PRO block */}
                          <div className="rounded-lg bg-cyan-400/5 border border-cyan-400/30 p-3">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 text-[10px] font-bold tracking-wider flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />ADVANCED
                              </span>
                              <span className="text-cyan-300/80 text-[10px] font-mono truncate">{proModels.slice(0, 4).join(' · ')}{proModels.length > 4 ? '…' : ''}</span>
                            </div>
                            <ul className="space-y-1">
                              {proTasks.map((t, i) => (
                                <li key={i} className="text-[12px] text-cyan-100/90 leading-snug flex gap-1.5">
                                  <span className="text-cyan-300 shrink-0">★</span>
                                  <span className="line-clamp-1">{t}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 opacity-60">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">{ui.free}</span>
                            <span className="text-muted-foreground/60 font-mono truncate">{freeModels.join(' · ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold">ADVANCED</span>
                            <span className="text-cyan-300/70 font-mono truncate">{proModels[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-7 pb-6 flex gap-2"
                      >
                        <button
                          onClick={handleFree}
                          className="flex-1 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider
                            bg-emerald-500/15 text-emerald-400 border border-emerald-500/40
                            hover:bg-emerald-500/25 transition-all"
                        >
                          FREE Access — 30 Días
                        </button>
                        <button
                          onClick={() => setAdvancedOpen(true)}
                          className="flex-1 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider
                            bg-black text-cyan-300 border border-cyan-400/70
                            hover:text-cyan-200 hover:border-cyan-300 transition-all"
                          style={{ boxShadow: '0 0 18px rgba(34,211,238,0.4), inset 0 0 12px rgba(34,211,238,0.08)' }}
                        >
                          <span className="flex items-center justify-center gap-1">
                            Ver Plan Advanced →
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Nav arrows */}
          <button
            onClick={() => go(-1)}
            className="absolute left-2 md:left-4 z-40 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-[#b49664]/40 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 md:right-4 z-40 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-[#b49664]/40 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 mt-6">
          {agents.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); resetAuto(); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      <AgentAdvancedModal
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        agentName={(agents[activeIndex].name as Record<string, string>)[lang] || (agents[activeIndex].name as any).en}
        proModels={(agents[activeIndex] as any).proModels || []}
      />
    </div>
  );
};