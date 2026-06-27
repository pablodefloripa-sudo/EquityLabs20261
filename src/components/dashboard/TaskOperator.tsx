import { useState, useEffect } from 'react';
import { Rocket, Zap, Brain, Code2, Megaphone, Bug, Thermometer, Sparkles, Target, CheckCircle2, Star, Copy, Trash2 } from 'lucide-react';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { useLanguage } from '@/hooks/useLanguage';

type OperationMode = 'seo' | 'fullstack' | 'copywriter' | 'debug';
type CreativityLevel = 'precision' | 'balanced' | 'brainstorm';

interface QuickInjectors {
  concise: boolean;
  humanExplain: boolean;
  markdown: boolean;
}

interface WinningPrompt {
  id: number;
  text: string;
  mode: OperationMode;
  timestamp: string;
}

const MODES: { key: OperationMode; labelKey: string; icon: React.ComponentType<{ className?: string }>; descKey: string; color: string }[] = [
  { key: 'seo', labelKey: 'op.mode.seo', icon: Target, descKey: 'op.mode.seo.desc', color: 'from-cyan-400 to-blue-500' },
  { key: 'fullstack', labelKey: 'op.mode.fullstack', icon: Code2, descKey: 'op.mode.fullstack.desc', color: 'from-green-400 to-emerald-500' },
  { key: 'copywriter', labelKey: 'op.mode.copywriter', icon: Megaphone, descKey: 'op.mode.copywriter.desc', color: 'from-orange-400 to-amber-500' },
  { key: 'debug', labelKey: 'op.mode.debug', icon: Bug, descKey: 'op.mode.debug.desc', color: 'from-red-400 to-rose-500' },
];

const CREATIVITY: { key: CreativityLevel; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'precision', labelKey: 'op.creat.precision', icon: Target },
  { key: 'balanced', labelKey: 'op.creat.balanced', icon: Brain },
  { key: 'brainstorm', labelKey: 'op.creat.brainstorm', icon: Sparkles },
];

export function TaskOperator() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<OperationMode>('fullstack');
  const [creativity, setCreativity] = useState<CreativityLevel>('balanced');
  const [injectors, setInjectors] = useState<QuickInjectors>({ concise: false, humanExplain: true, markdown: true });
  const [mission, setMission] = useState('');
  const [winningPrompts, setWinningPrompts] = useState<WinningPrompt[]>([
    { id: 1, text: 'Optimizar SEO para landing de SaaS B2B', mode: 'seo', timestamp: 'Hoy' },
    { id: 2, text: 'Refactorizar auth flow con Supabase', mode: 'fullstack', timestamp: 'Ayer' },
  ]);

  const toggleInjector = (key: keyof QuickInjectors) => {
    setInjectors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveWinningPrompt = () => {
    if (!mission.trim()) return;
    setWinningPrompts(prev => [
      { id: Date.now(), text: mission, mode, timestamp: 'Ahora' },
      ...prev,
    ]);
    setMission('');
  };

  const deletePrompt = (id: number) => {
    setWinningPrompts(prev => prev.filter(p => p.id !== id));
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const activeMode = MODES.find(m => m.key === mode)!;
  const activeCreativity = CREATIVITY.findIndex(c => c.key === creativity);

  return (
    <CollapsibleSidebar
      side="right"
      title={t('op.title')}
      icon={<Rocket className="w-4 h-4" />}
      tabPosition="30%"
    >
      <div className="space-y-5">
        {/* ── MODO DE OPERACIÓN ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.mode')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(m => {
              const Icon = m.icon;
              const isActive = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`relative p-2.5 rounded-xl border text-left transition-all duration-300 group overflow-hidden
                    ${isActive
                      ? 'border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]'
                      : 'border-border/20 bg-muted/20 hover:border-primary/30 hover:bg-muted/40'
                    }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-[0.07]`} />
                  )}
                  <div className="relative flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`} />
                    <span className={`text-[11px] font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t(m.labelKey)}
                    </span>
                  </div>
                  <p className="relative text-[9px] text-muted-foreground/50 leading-tight">{t(m.descKey)}</p>
                  {isActive && <div className="absolute top-1.5 right-1.5"><CheckCircle2 className="w-3 h-3 text-primary" /></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── INTENSIDAD DE CREATIVIDAD ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.creativity')}</span>
          </div>
          <div className="flex gap-1.5">
            {CREATIVITY.map((c, i) => {
              const Icon = c.icon;
              const isActive = creativity === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCreativity(c.key)}
                  className={`flex-1 p-2 rounded-xl border text-center transition-all duration-300
                    ${isActive
                      ? 'border-accent/60 bg-accent/10 shadow-[0_0_12px_rgba(var(--accent-rgb),0.12)]'
                      : 'border-border/20 bg-muted/20 hover:border-accent/30'
                    }`}
                >
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${isActive ? 'text-accent' : 'text-muted-foreground/50'}`} />
                  <span className={`text-[9px] font-bold block ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                    {t(c.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Temperature bar */}
          <div className="mt-2 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(activeCreativity + 1) * 33.3}%` }}
            />
          </div>
        </div>

        {/* ── INYECTORES RÁPIDOS ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3 h-3 text-success" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.injectors')}</span>
          </div>
          <div className="space-y-1.5">
            {([
              { key: 'concise' as const, labelKey: 'op.inj.concise', descKey: 'op.inj.concise.desc' },
              { key: 'humanExplain' as const, labelKey: 'op.inj.human', descKey: 'op.inj.human.desc' },
              { key: 'markdown' as const, labelKey: 'op.inj.markdown', descKey: 'op.inj.markdown.desc' },
            ]).map(inj => (
              <button
                key={inj.key}
                onClick={() => toggleInjector(inj.key)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200
                  ${injectors[inj.key]
                    ? 'border-success/40 bg-success/5'
                    : 'border-border/20 bg-muted/20 hover:border-border/40'
                  }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0
                  ${injectors[inj.key]
                    ? 'border-success bg-success'
                    : 'border-muted-foreground/30'
                  }`}>
                  {injectors[inj.key] && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
                </div>
                <div className="text-left">
                  <span className={`text-[11px] font-bold block ${injectors[inj.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(inj.labelKey)}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">{t(inj.descKey)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── MISIÓN INPUT ── */}
        <div>
          <textarea
            value={mission}
            onChange={e => setMission(e.target.value)}
            placeholder={t('op.mission_placeholder')}
            rows={3}
            className="w-full bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-primary/50 focus:shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)] transition-all"
          />
          <button
            onClick={saveWinningPrompt}
            disabled={!mission.trim()}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Star className="w-3.5 h-3.5" />
            {t('op.save_prompt')}
          </button>
        </div>

        {/* ── PROMPTS GANADORES ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">{t('op.winning')}</span>
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
            {winningPrompts.map(p => {
              const pMode = MODES.find(m => m.key === p.mode);
              return (
                <div key={p.id} className="p-2.5 rounded-xl bg-muted/20 border border-border/20 group hover:border-warning/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] text-foreground/80 leading-tight flex-1">{p.text}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => copyPrompt(p.text)} className="text-muted-foreground/50 hover:text-primary">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => deletePrompt(p.id)} className="text-muted-foreground/50 hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 font-mono">{pMode ? t(pMode.labelKey) : ''}</span>
                    <span className="text-[8px] text-muted-foreground/40">{p.timestamp}</span>
                  </div>
                </div>
              );
            })}
            {winningPrompts.length === 0 && (
              <p className="text-[10px] text-muted-foreground/40 text-center py-4">{t('op.no_prompts')}</p>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSidebar>
  );
}
