import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Cpu,
  Plus,
  ShieldCheck,
  BarChart3,
  Image as ImageIcon,
  Layout,
  Telescope,
  Clapperboard,
  Music,
  GraduationCap,
  Sparkles,
  FileBarChart,
  TrendingUp,
  Cat,
  X,
} from 'lucide-react';
import { InlineToolsPanel } from './InlineToolsPanel';
import { AgentResponsePanel } from './AgentResponsePanel';
import { MascotGreeting } from './MascotGreeting';
import { MascotTaskDialog } from './MascotTaskDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceWaveform } from './VoiceWaveform';

import { useAIChat } from '@/hooks/useAIChat';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  model?: string;
  toolLabel?: string;
  reaction?: 'up' | 'down' | null;
  mascot?: boolean;
  agentCommand?: {
    agentName: string;
    userName?: string;
    selectedRole?: string;
    proposals: string[];
  };
}

interface CommunicationAreaProps {
  onEnterFocusMode: () => void;
}

type InlineToolKey =
  | 'create_image'
  | 'canvas_organize'
  | 'deep_research'
  | 'create_video_brief'
  | 'create_music_brief'
  | 'learn'
  | 'prompt_engineer'
  | 'generate_report'
  | 'market_analysis'
  | 'project_metrics'
  | 'mascot';

type AgentProjectForm = {
  projectName: string;
  objective: string;
  mainMetric: string;
  targetValue: string;
  deadline: string;
  dataSource: string;
};

const emptyAgentProjectForm: AgentProjectForm = {
  projectName: '',
  objective: '',
  mainMetric: '',
  targetValue: '',
  deadline: '',
  dataSource: '',
};

const DEFAULT_ENGINE = 'tencent/hy3:free';
const ACTIVE_AGENT_STORAGE_KEY = 'eq_active_agent_context';
const PROJECT_ROOTS_STORAGE_KEY = 'eq_project_roots';
const INLINE_TOOL_META: Record<InlineToolKey, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  create_image: { label: 'Crear imagen', icon: ImageIcon },
  canvas_organize: { label: 'Canvas', icon: Layout },
  deep_research: { label: 'Deep Research', icon: Telescope },
  create_video_brief: { label: 'Video', icon: Clapperboard },
  create_music_brief: { label: 'Musica', icon: Music },
  learn: { label: 'Learn', icon: GraduationCap },
  prompt_engineer: { label: 'Prompt Eng.', icon: Sparkles },
  generate_report: { label: 'Reporte', icon: FileBarChart },
  market_analysis: { label: 'Mercado', icon: TrendingUp },
  project_metrics: { label: 'Metricas', icon: BarChart3 },
  mascot: { label: 'Mascota IA', icon: Cat },
};

type ProjectRootRecord = {
  id: string;
  agentName: string;
  userName: string;
  selectedRole: string;
  subscriptionPlan: string;
  projectName: string;
  projectTrunk: string;
  completionWindow: string;
  weeklyHours: string;
  nextTask: string;
  createdAt: string;
};

const ORCHESTRATOR_ROLE_OPTIONS = [
  'SEO Estrategico',
  'Full-Stack Developer',
  'Copywriter de Conversion',
  'Debug Mode / QA',
  'Productividad & Neuroplasticidad',
  'Growth & Tokenomics',
  'Auditor de Metricas de Impacto',
];

const OPERATION_MODES = [
  'SEO Estratégico',
  'Full-Stack Dev',
  'Copywriter',
  'Debug Mode',
  'Creatividad',
  'Precisión Quirúrgica',
] as const;

const STYLE_MODES = [
  'Equilibrado',
  'Lluvia de Ideas',
  'Concisión Extrema',
  'Explicación Humana',
  'Formato Markdown',
] as const;

const metricFields: Array<{
  key: keyof AgentProjectForm;
  label: string;
  placeholder: string;
}> = [
  { key: 'projectName', label: 'Proyecto', placeholder: 'Ej: Velvet Revenue Sprint' },
  { key: 'objective', label: 'Objetivo', placeholder: 'Resultado que queres lograr' },
  { key: 'mainMetric', label: 'Metrica principal', placeholder: 'Ej: conversion, ingresos, leads' },
  { key: 'targetValue', label: 'Meta', placeholder: 'Ej: +18%, 50 leads, $10k' },
  { key: 'deadline', label: 'Fecha limite', placeholder: 'Ej: 30 dias, 2026-08-15' },
  { key: 'dataSource', label: 'Fuente de datos', placeholder: 'Sheets, CRM, manual, Analytics' },
];

const StatusLEDs = ({ isThinking }: { isThinking: boolean }) => (
  <div className="flex items-center gap-2">
    {(['#FF5F57', '#FEBC2E', '#28C840'] as const).map((color, i) => (
      <motion.div
        key={color}
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
        animate={isThinking ? {
          opacity: [0.3, 1, 0.3],
          scale: [0.9, 1.1, 0.9],
        } : {
          opacity: [0.7, 1, 0.7],
        }}
        transition={isThinking ? {
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.2,
        } : {
          duration: 2,
          repeat: Infinity,
        }}
      />
    ))}
  </div>
);

const buildAgentCommand = (agentName: string, tasks: string[], engine: string, userName: string) => {
  const safeTasks = tasks.length ? tasks : ['Buscar norte estrategico', 'Implementar agentes necesarios', 'Auditar rendimiento y permisos'];
  const proposals = safeTasks.slice(0, 3);

  return {
    prompt: [
      `Ejecucion inmediata con ${agentName}.`,
      `Motor inicial: ${engine}.`,
      '',
      `Contexto del agente: ${safeTasks.join(' | ')}`,
      '',
      'Objetivo: encontrar el norte estrategico del usuario, proponer el squad minimo de agentes, abrir un proyecto operativo, definir metricas de rendimiento, auditoria, control y permisos requeridos.',
      '',
      'Empeza por la propuesta 1 salvo que el usuario elija otra.',
    ].join('\n'),
    content: [
      `**${agentName} listo para operar.**`,
      '',
      `Hola ${userName}. Ya entendí que este agente fue elegido como punto de entrada.`,
      '',
      'Antes de ejecutar, vamos a abrir el documento raiz del proyecto y dejar registrada la proxima tarea.',
      '',
      'Completá este kickoff rapido: rol operativo, tronco, tiempo disponible, horas semanales y siguiente micro-accion.',
    ].join('\n'),
    proposals,
  };
};

const getOperatorName = (user: ReturnType<typeof useAuth>['user']) => {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  if (typeof meta?.full_name === 'string' && meta.full_name.trim()) return meta.full_name;
  if (typeof meta?.name === 'string' && meta.name.trim()) return meta.name;
  if (typeof user?.email === 'string' && user.email.trim()) return user.email.split('@')[0];
  return 'Operador';
};

const KickoffDialogCard = ({
  agentName,
  userName,
  selectedRole,
  subscriptionPlan,
  onSave,
}: {
  agentName: string;
  userName: string;
  selectedRole: string;
  subscriptionPlan: string;
  onSave: (record: ProjectRootRecord) => void;
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectTrunk, setProjectTrunk] = useState('');
  const [completionWindow, setCompletionWindow] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [nextTask, setNextTask] = useState('');
  const [role, setRole] = useState(selectedRole);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!projectName.trim() || !projectTrunk.trim()) return;

    onSave({
      id: crypto.randomUUID(),
      agentName,
      userName,
      selectedRole: role,
      subscriptionPlan,
      projectName: projectName.trim(),
      projectTrunk: projectTrunk.trim(),
      completionWindow: completionWindow.trim(),
      weeklyHours: weeklyHours.trim(),
      nextTask: nextTask.trim(),
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border border-cyan-300/22 bg-black/55 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/70">Documento raiz del proyecto</p>
          <h3 className="mt-1 text-base font-semibold text-cyan-50">{userName}, definamos el tronco y la proxima tarea</h3>
        </div>
        <div className="rounded-full border border-emerald-300/18 bg-emerald-300/8 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100/75">
          {subscriptionPlan}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-300/14 bg-cyan-300/6 px-3 py-2">
          <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-200/70">Agente seleccionado</span>
          <strong className="mt-1 block text-sm text-cyan-50">{agentName}</strong>
        </div>
        <div className="rounded-2xl border border-violet-300/14 bg-violet-300/6 px-3 py-2">
          <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-violet-200/70">Rol operativo</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ORCHESTRATOR_ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                  role === option
                    ? 'border-cyan-300/60 bg-cyan-300/14 text-cyan-50'
                    : 'border-white/10 bg-white/5 text-slate-300/75 hover:border-cyan-300/30'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Proyecto</span>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Ej. Job Booster Sprint" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Tiempo disponible</span>
          <input value={completionWindow} onChange={(e) => setCompletionWindow(e.target.value)} placeholder="Ej. 30 dias / 12 semanas" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Horas semanales</span>
          <input value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="Ej. 10h / 20h" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
        <label className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
          <span className="mb-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-slate-300/70">Proxima micro-tarea</span>
          <input value={nextTask} onChange={(e) => setNextTask(e.target.value)} placeholder="Ej. mapear keyword clusters" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </label>
      </div>

      <div className="mt-3">
        <Textarea
          value={projectTrunk}
          onChange={(e) => setProjectTrunk(e.target.value)}
          placeholder="Defini el tronco del proyecto: problema real, impacto, restriccion y resultado esperado."
          className="min-h-[110px] border-white/10 bg-black/18 text-sm text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">Esto queda guardado para volver a buscarlo en el futuro.</p>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saved || !projectName.trim() || !projectTrunk.trim()}
          className="rounded-xl bg-cyan-600 px-4 text-sm text-white hover:bg-cyan-500"
        >
          {saved ? 'Guardado' : 'Guardar documento raiz'}
        </Button>
      </div>
    </div>
  );
};

export const CommunicationArea = ({ onEnterFocusMode }: CommunicationAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [mascotTask, setMascotTask] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [responseScale, setResponseScale] = useState(1);
  const [selectedInlineTool, setSelectedInlineTool] = useState<{ key: InlineToolKey; label: string } | null>(null);
  const [activeAgentName, setActiveAgentName] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeAgentEngine, setActiveAgentEngine] = useState<string>(DEFAULT_ENGINE);
  const [agentProjectForm, setAgentProjectForm] = useState<AgentProjectForm>(emptyAgentProjectForm);
  const [operationMode, setOperationMode] = useState<(typeof OPERATION_MODES)[number]>('SEO Estratégico');
  const [styleMode, setStyleMode] = useState<(typeof STYLE_MODES)[number]>('Explicación Humana');
  const [missionToday, setMissionToday] = useState('');
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitDate, setTimeLimitDate] = useState('');
  const [fundsAvailable, setFundsAvailable] = useState<'si' | 'no'>('si');
  const [winnerPrompts, setWinnerPrompts] = useState<Array<{ id: string; title: string; prompt: string; savedAt: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { sendMessage, isLoading: aiLoading } = useAIChat();
  const getWaveformState = (): 'idle' | 'thinking' | 'speaking' => {
    if (aiLoading) return 'thinking';
    return 'idle';
  };

  // Permanent auto-focus
  const forceFocus = useCallback(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => { forceFocus(); }, [forceFocus]);

  useEffect(() => {
    const handleFocusConsole = () => forceFocus();
    window.addEventListener('eq:focus-console', handleFocusConsole);
    return () => window.removeEventListener('eq:focus-console', handleFocusConsole);
  }, [forceFocus]);

  useEffect(() => {
    const zoomIn = () => setResponseScale(value => Math.min(1.45, Number((value + 0.08).toFixed(2))));
    const zoomOut = () => setResponseScale(value => Math.max(0.86, Number((value - 0.08).toFixed(2))));

    window.addEventListener('eq:response-zoom-in', zoomIn);
    window.addEventListener('eq:response-zoom-out', zoomOut);
    return () => {
      window.removeEventListener('eq:response-zoom-in', zoomIn);
      window.removeEventListener('eq:response-zoom-out', zoomOut);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('eq_winner_prompts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setWinnerPrompts(parsed);
        }
      }
    } catch {
      // ignore malformed local cache
    }
  }, []);

  useEffect(() => {
    const handleAgentSelected = (event: Event) => {
      const detail = (event as CustomEvent<{
        id?: string;
        name?: string;
        tasks?: string[];
        engine?: string;
      }>).detail || {};
      const agentName = detail.name || 'Agente';
      const engine = detail.engine || DEFAULT_ENGINE;
      const operatorName = getOperatorName(user);
      const command = buildAgentCommand(agentName, detail.tasks || [], engine, operatorName);
      const subscriptionRaw = localStorage.getItem('eq_subscription_context');
      const subscription = subscriptionRaw ? JSON.parse(subscriptionRaw) : null;
      localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, JSON.stringify({
        id: detail.id,
        name: agentName,
        engine,
        tasks: detail.tasks || [],
        selectedAt: new Date().toISOString(),
      }));
      (window as unknown as {
        __eqDashboardContext?: unknown;
      }).__eqDashboardContext = {
        activeAgent: {
          id: detail.id,
          name: agentName,
          engine,
          tasks: detail.tasks || [],
        },
        subscription,
        updatedAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: command.content,
        timestamp: new Date(),
        model: engine,
        agentCommand: {
          agentName,
          userName: operatorName,
          proposals: command.proposals,
        },
      }]);
      setInputValue('');
      setActiveAgentName(agentName);
      setActiveAgentId(detail.id || null);
      setActiveAgentEngine(engine);
      setAgentProjectForm(emptyAgentProjectForm);
      setToolsOpen(false);
      forceFocus();
    };

    window.addEventListener('eq:agent-selected', handleAgentSelected);
    return () => window.removeEventListener('eq:agent-selected', handleAgentSelected);
  }, [forceFocus, user]);

  useEffect(() => {
    if (messages.length > 0) return;

    try {
      const rawActiveAgent = localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY);
      if (!rawActiveAgent) return;

      const activeAgent = JSON.parse(rawActiveAgent) as {
        id?: string;
        name?: string;
        engine?: string;
        tasks?: string[];
      };

      if (!activeAgent.name) return;

      const operatorName = getOperatorName(user);
      const command = buildAgentCommand(
        activeAgent.name,
        activeAgent.tasks || [],
        activeAgent.engine || DEFAULT_ENGINE,
        operatorName,
      );

      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: command.content,
        timestamp: new Date(),
        model: activeAgent.engine || DEFAULT_ENGINE,
        agentCommand: {
          agentName: activeAgent.name,
          userName: operatorName,
          proposals: command.proposals,
        },
      }]);
      setActiveAgentName(activeAgent.name);
      setActiveAgentId(activeAgent.id || null);
      setActiveAgentEngine(activeAgent.engine || DEFAULT_ENGINE);
    } catch {
      // ignore malformed active agent cache
    }
  }, [messages.length, user]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      const lineH = 28;
      const maxH = lineH * 5 + 24;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
    }
  }, []);

  useEffect(() => { autoResize(); }, [inputValue, autoResize]);

  // Resume saved session from HistoryModal
  useEffect(() => {
    const loadResume = (detail?: { messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }> }) => {
      let msgs = detail?.messages;
      if (!msgs) {
        try {
          const raw = sessionStorage.getItem('eq_resume_session');
          if (raw) msgs = JSON.parse(raw).messages;
        } catch { /* ignore */ }
      }
      if (msgs && msgs.length) {
        setMessages(msgs.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        })));
        if ((detail as { context?: unknown } | undefined)?.context) {
          (window as unknown as { __eqDashboardContext?: unknown }).__eqDashboardContext = (detail as { context?: unknown }).context;
        }
        sessionStorage.removeItem('eq_resume_session');
        forceFocus();
      }
    };
    loadResume();
    const handler = (e: Event) => loadResume((e as CustomEvent).detail);
    window.addEventListener('eq:resume-session', handler);
    return () => window.removeEventListener('eq:resume-session', handler);
  }, [forceFocus]);

  // Listen for tool prompts/results from ToolsMenu
  useEffect(() => {
    const onPrompt = (e: Event) => {
      const { tool, prompt } = (e as CustomEvent).detail || {};
      if (!prompt) return;
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'user',
        content: `**${tool}** — ${prompt}`,
        timestamp: new Date(),
      }]);
      forceFocus();
    };
    const onResult = (e: Event) => {
      const { tool, model, content, imageUrl } = (e as CustomEvent).detail || {};
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: content || (imageUrl ? `Imagen generada para: ${tool}` : ''),
        imageUrl,
        model,
        toolLabel: tool,
        timestamp: new Date(),
      }]);
      forceFocus();
    };
    const onMascot = () => {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        toolLabel: 'Mascota',
        mascot: true,
        timestamp: new Date(),
      }]);
      forceFocus();
    };
    window.addEventListener('eq:tool-user-prompt', onPrompt);
    window.addEventListener('eq:tool-result', onResult);
    window.addEventListener('eq:mascot-greeting', onMascot);
    return () => {
      window.removeEventListener('eq:tool-user-prompt', onPrompt);
      window.removeEventListener('eq:tool-result', onResult);
      window.removeEventListener('eq:mascot-greeting', onMascot);
    };
  }, [forceFocus]);

  useEffect(() => {
    const handleInlineToolSelected = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: InlineToolKey; label?: string }>).detail || {};
      if (!detail.key || !INLINE_TOOL_META[detail.key]) return;
      setSelectedInlineTool({
        key: detail.key,
        label: detail.label || INLINE_TOOL_META[detail.key].label,
      });
      forceFocus();
    };

    const handleInlineToolCleared = () => {
      setSelectedInlineTool(null);
      forceFocus();
    };

    window.addEventListener('eq:inline-tool-selected', handleInlineToolSelected);
    window.addEventListener('eq:inline-tool-cleared', handleInlineToolCleared);
    return () => {
      window.removeEventListener('eq:inline-tool-selected', handleInlineToolSelected);
      window.removeEventListener('eq:inline-tool-cleared', handleInlineToolCleared);
    };
  }, [forceFocus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Publish current messages so ExitModal can snapshot the full session
    (window as unknown as { __eqMessages?: Message[] }).__eqMessages = messages;
  }, [messages]);

  const setReaction = (id: string, reaction: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction: m.reaction === reaction ? null : reaction } : m));
    forceFocus();
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    forceFocus();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || aiLoading) return;

    if (selectedInlineTool) {
      const currentInput = inputValue.trim();
      setInputValue('');
      forceFocus();
      window.dispatchEvent(new CustomEvent('eq:run-selected-tool', {
        detail: {
          prompt: currentInput,
          preferredModel: activeAgentEngine || DEFAULT_ENGINE,
          agentId: activeAgentId || undefined,
        },
      }));
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    forceFocus();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(currentInput, history, activeAgentId || undefined);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        model: typeof result.meta?.effectiveModel === 'string'
          ? result.meta.effectiveModel
          : typeof result.meta?.model === 'string'
            ? result.meta.model
            : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
      forceFocus();

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'AI no disponible',
        description: errorMessageText,
        variant: 'destructive',
      });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('chat.error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      forceFocus();
    }
  };

  const updateAgentProjectField = (key: keyof AgentProjectForm, value: string) => {
    setAgentProjectForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAgentProjectSubmit = async () => {
    if (!activeAgentName || aiLoading) return;

    const filled = metricFields
      .map(field => `${field.label}: ${agentProjectForm[field.key].trim() || 'Pendiente'}`)
      .join('\n');
    const instructionOne = [
      `Modo de Operacion: ${operationMode}.`,
      `Estilo de respuesta: ${styleMode}.`,
      `Mision de hoy: ${missionToday.trim() || 'Pendiente'}.`,
      `Time limit: ${timeLimitEnabled ? (timeLimitDate || 'Definido por el usuario') : 'Sin limite'}.`,
      `Fondos disponibles: ${fundsAvailable === 'si' ? 'Si' : 'No'}.`,
    ].join('\n');
    const currentAgentName = activeAgentName;
    const currentAgentId = activeAgentId;
    const currentInput = [
      `Activar ${currentAgentName} con este proyecto y llevar metricas operativas.`,
      `Motor configurado: ${activeAgentEngine || DEFAULT_ENGINE}.`,
      '',
      'Instruccion 1:',
      instructionOne,
      '',
      'Instruccion 2:',
      filled,
      '',
      'Devolve checkpoints, riesgos, permisos necesarios y primera accion medible.',
    ].join('\n');

    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: [
        `**${currentAgentName} — tablero de metricas**`,
        '',
        filled,
      ].join('\n'),
      timestamp: new Date(),
    }]);
    setActiveAgentName(null);
    setInputValue('');
    forceFocus();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(currentInput, history, currentAgentId || undefined);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        model: typeof result.meta?.effectiveModel === 'string'
          ? result.meta.effectiveModel
          : typeof result.meta?.model === 'string'
            ? result.meta.model
            : currentAgentName,
      }]);
    } catch (error) {
      console.error('Error sending agent metrics:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'AI no disponible',
        description: errorMessageText,
        variant: 'destructive',
      });
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('chat.error'),
        timestamp: new Date(),
      }]);
    } finally {
      forceFocus();
    }
  };

  const saveWinnerPrompt = () => {
    const prompt = [
      `Modo: ${operationMode}`,
      `Estilo: ${styleMode}`,
      `Mision: ${missionToday.trim() || 'Pendiente'}`,
      `Time limit: ${timeLimitEnabled ? (timeLimitDate || 'Definido por el usuario') : 'Sin limite'}`,
      `Fondos: ${fundsAvailable === 'si' ? 'Si' : 'No'}`,
    ].join(' | ');

    const nextEntry = {
      id: crypto.randomUUID(),
      title: `${operationMode} · ${styleMode}`,
      prompt,
      savedAt: new Date().toISOString(),
    };

    setWinnerPrompts(prev => {
      const next = [nextEntry, ...prev].slice(0, 6);
      localStorage.setItem('eq_winner_prompts', JSON.stringify(next));
      return next;
    });
    toast({ title: 'Prompt ganador guardado', description: operationMode });
  };

  const requestIntegration = (provider: string, reason: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: [
        `**Permiso requerido: ${provider}.**`,
        '',
        reason,
        '',
        'Voy a abrir el centro de integraciones para que confirmes el acceso. Sin confirmacion, el agente trabaja con datos manuales o archivos cargados por vos.',
      ].join('\n'),
      timestamp: new Date(),
      model: 'permission-router',
    }]);
    window.dispatchEvent(new CustomEvent('eq:open-integration-center', { detail: { provider, reason } }));
    forceFocus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedInlineToolMeta = selectedInlineTool ? INLINE_TOOL_META[selectedInlineTool.key] : null;
  const SelectedInlineToolIcon = selectedInlineToolMeta?.icon;

  return (
    <div className="relative mx-auto h-full w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Waveform */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-48 z-10">
        <VoiceWaveform state={getWaveformState()} />
      </div>

      {/* Messages */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden px-1"
        style={{
          bottom: 'calc(var(--dashboard-console-height) + var(--dashboard-console-gap) + 18px)',
        }}
      >
        <div className="flex h-full flex-col justify-end min-h-0">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <p className="text-muted-foreground/40 text-xs font-mono tracking-widest">Meta-Learning focus mode</p>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin pb-6">
            <div className="mx-auto w-full max-w-4xl space-y-3">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="w-full">
                      {msg.mascot && !msg.content ? (
                        <MascotGreeting onPickTask={(task) => setMascotTask(task)} />
                      ) : msg.imageUrl ? (
                        <div className="rounded-2xl border border-cyan-400/30 bg-black/60 backdrop-blur-xl p-3">
                          <img src={msg.imageUrl} alt={msg.toolLabel || 'Imagen'} className="w-full max-w-xl rounded-xl" />
                        </div>
                      ) : (
                        <>
                          <AgentResponsePanel
                            content={msg.content}
                            model={msg.model}
                            mascot={msg.mascot}
                            responseScale={responseScale}
                            isThinking={aiLoading}
                          />
                          {msg.agentCommand && (
                            <div className="mt-2 rounded-2xl border border-cyan-400/20 bg-black/45 p-3 backdrop-blur-xl">
                              <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300/75">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Opciones de arranque
                              </div>
                              <div className="grid gap-2 md:grid-cols-3">
                                {msg.agentCommand.proposals.map((proposal, proposalIndex) => (
                                  <button
                                    key={proposal}
                                    onClick={() => {
                                      setInputValue(`Ejecutar propuesta ${proposalIndex + 1} con ${msg.agentCommand?.agentName}: ${proposal}`);
                                      forceFocus();
                                    }}
                                    className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-left text-[11px] leading-snug text-cyan-50/80 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
                                  >
                                    <span className="mb-1 block font-mono text-cyan-300">0{proposalIndex + 1}</span>
                                    {proposal}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => requestIntegration('Google Workspace', 'Esta ejecucion necesita Gmail, Drive, Calendar o Sheets para leer datos reales y accionar con permiso explicito.')}
                                className="mt-2 rounded-lg border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-1.5 text-[11px] font-medium text-fuchsia-100 transition hover:border-fuchsia-200/45 hover:bg-fuchsia-400/15"
                              >
                                Conectar permisos si hacen falta
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {/* Footer outside the box: model + reactions + delete */}
                      {!(msg.mascot && !msg.content) && (
                      <div className="mt-1 flex items-center gap-2 px-1">
                        <Cpu className="w-3 h-3 text-cyan-400/70" />
                        <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider">
                          {msg.model || 'gemini-2.5-flash'}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => setReaction(msg.id, 'up')}
                            className={`p-1 rounded-md transition-colors ${msg.reaction === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-muted-foreground/50 hover:text-emerald-400 hover:bg-emerald-400/10'}`}
                            title="Me gusta"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setReaction(msg.id, 'down')}
                            className={`p-1 rounded-md transition-colors ${msg.reaction === 'down' ? 'text-orange-400 bg-orange-400/10' : 'text-muted-foreground/50 hover:text-orange-400 hover:bg-orange-400/10'}`}
                            title="No me gusta"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative max-w-[80%] overflow-hidden rounded-[22px] border border-cyan-300/30 bg-[linear-gradient(180deg,rgba(7,18,34,0.90)_0%,rgba(3,7,14,0.92)_100%)] px-4 py-4 text-sm text-cyan-50/90 backdrop-blur-2xl shadow-[0_0_32px_rgba(34,211,238,0.12),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.08]"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 20% 0%, rgba(34,211,238,0.14), transparent 28%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.08), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.05), transparent 28%, rgba(34,211,238,0.05))',
                        }}
                      />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent" />
                      <div className="relative z-10 mb-3 flex items-center gap-2 font-mono text-[10px] text-cyan-200/55">
                        <span className="rounded border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5">you</span>
                        <span>equitylabs://user-input</span>
                      </div>
                      <div className="relative z-10 font-mono text-[clamp(12px,calc(13px*var(--response-scale)),20px)] leading-relaxed">
                        {msg.content}
                      </div>
                      <div className="absolute top-0 left-0 h-3 w-3 rounded-tl-[22px] border-l border-t border-cyan-400/45" />
                      <div className="absolute top-0 right-0 h-3 w-3 rounded-tr-[22px] border-r border-t border-cyan-400/35" />
                      <div className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-[22px] border-b border-l border-cyan-400/35" />
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-br-[22px] border-b border-r border-cyan-400/45" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Command Console */}
      <div
        className="absolute inset-x-0 z-20"
        style={{
          bottom: 'var(--dashboard-console-gap)',
        }}
      >
        <InlineToolsPanel open={toolsOpen} onClose={() => setToolsOpen(false)} />
        {false && activeAgentName ? (
          <motion.div
            key={activeAgentName}
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-300/55 bg-black/60 backdrop-blur-2xl"
            style={{
              boxShadow: '0 0 44px rgba(34,211,238,0.34), inset 0 0 24px rgba(6,182,212,0.16)',
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent" />
            <div className="relative border-b border-cyan-300/18 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/35 bg-black/50">
                  <div className="flex h-full w-full items-center justify-center bg-black/80 text-[9px] font-mono uppercase tracking-[0.18em] text-emerald-200/70">
                    HY3
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-semibold tracking-wide text-cyan-50">
                    {activeAgentName}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/60">
                    Formulario tecnico interno
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1">
                  <Cpu className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-100/70">
                    {activeAgentEngine || DEFAULT_ENGINE}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-2xl border border-emerald-300/16 bg-emerald-300/6 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-200/70">
                    Motor configurado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-50">
                    {activeAgentEngine || DEFAULT_ENGINE}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-emerald-100/55">
                    Razonamiento multi-paso, orquestacion de agentes y ejecucion de largo recorrido.
                    Pensado para panel interno, trazabilidad y proyectos operativos.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-300/16 bg-black/25 px-2.5 py-1 text-[10px] text-emerald-100/70">
                      1M context
                    </span>
                    <span className="rounded-full border border-emerald-300/16 bg-black/25 px-2.5 py-1 text-[10px] text-emerald-100/70">
                      MoE
                    </span>
                    <span className="rounded-full border border-emerald-300/16 bg-black/25 px-2.5 py-1 text-[10px] text-emerald-100/70">
                      Agentic workflows
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-300/15 bg-black/28 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/60">
                    Perfil tecnico
                  </p>
                  <div className="mt-2 grid gap-2 text-[11px] text-cyan-50/72">
                    <p>• Modelo base para el proyecto nuevo: <span className="text-cyan-200">{activeAgentEngine || DEFAULT_ENGINE}</span></p>
                    <p>• Salida pensada para panel interno y trazabilidad operativa.</p>
                    <p>• Debe mantener respuestas directas y resumen ejecutivo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-cyan-300/12 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">Modo de Operación</p>
                  <h3 className="mt-1 text-sm font-semibold text-cyan-50">Instrucción 1 del nuevo proyecto</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeLimitEnabled((value) => !value)}
                  className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-100/80 transition hover:bg-emerald-300/15"
                >
                  Time Limit
                </button>
              </div>

              <div className="mt-3 grid gap-3">
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                    Modos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OPERATION_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setOperationMode(mode)}
                        className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-all duration-200 ${
                          operationMode === mode
                            ? 'border-cyan-300/55 bg-gradient-to-r from-cyan-300/20 to-emerald-300/14 text-cyan-50 shadow-[0_0_0_1px_rgba(103,232,249,0.12),0_10px_24px_rgba(34,211,238,0.08)]'
                            : 'border-white/10 bg-white/5 text-cyan-50/72 hover:border-cyan-300/28 hover:bg-cyan-300/10 hover:text-cyan-50'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            operationMode === mode ? 'bg-cyan-200 shadow-[0_0_10px_rgba(165,243,252,0.65)]' : 'bg-white/20 group-hover:bg-cyan-200/60'
                          }`}
                        />
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                    Formato y tono
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_MODES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setStyleMode(style)}
                        className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-all duration-200 ${
                          styleMode === style
                            ? 'border-emerald-300/55 bg-gradient-to-r from-emerald-300/18 to-teal-300/14 text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.10),0_10px_24px_rgba(16,185,129,0.08)]'
                            : 'border-white/10 bg-white/5 text-emerald-50/72 hover:border-emerald-300/28 hover:bg-emerald-300/10 hover:text-emerald-50'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            styleMode === style ? 'bg-emerald-200 shadow-[0_0_10px_rgba(167,243,208,0.65)]' : 'bg-white/20 group-hover:bg-emerald-200/60'
                          }`}
                        />
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <label className="rounded-xl border border-cyan-300/16 bg-cyan-300/7 px-3 py-2">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">
                      Escribe la misión de hoy...
                    </span>
                    <Textarea
                      value={missionToday}
                      onChange={(event) => setMissionToday(event.target.value)}
                      placeholder="Escribe la misión de hoy..."
                      className="min-h-[100px] border-0 bg-transparent p-0 text-sm text-cyan-50 placeholder:text-cyan-100/24 focus-visible:ring-0"
                    />
                  </label>

                  <div className="space-y-3 rounded-xl border border-emerald-300/16 bg-emerald-300/6 p-3">
                    <div>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">
                        Fondos disponibilidad
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['si', 'no'] as const).map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setFundsAvailable(choice)}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                              fundsAvailable === choice
                                ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50'
                                : 'border-white/10 bg-black/20 text-emerald-100/60 hover:border-emerald-300/20 hover:bg-emerald-300/10'
                            }`}
                          >
                            {choice === 'si' ? 'Si' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {timeLimitEnabled && (
                      <label className="block rounded-xl border border-emerald-300/16 bg-black/20 px-3 py-2">
                        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200/70">
                          Seleccionar fecha
                        </span>
                        <input
                          type="date"
                          value={timeLimitDate}
                          onChange={(event) => setTimeLimitDate(event.target.value)}
                          className="w-full bg-transparent text-sm text-emerald-50 outline-none"
                        />
                      </label>
                    )}

                    {!timeLimitEnabled && (
                      <p className="text-xs leading-relaxed text-emerald-100/50">
                        Presioná <span className="text-emerald-200">Time Limit</span> para abrir el selector de fecha.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={saveWinnerPrompt}
                    className="rounded-full border border-fuchsia-300/25 bg-fuchsia-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-50 transition hover:bg-fuchsia-400/15"
                  >
                    Guardar Prompt Ganador
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-200/40">
                    Todo esto se envía como instrucción 1 del proyecto
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {metricFields.map((field, index) => (
                <motion.label
                  key={field.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12 + index * 0.08 }}
                  className="rounded-xl border border-cyan-300/16 bg-cyan-300/7 px-3 py-2"
                >
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">
                    {field.label}
                  </span>
                  <input
                    value={agentProjectForm[field.key]}
                    onChange={(event) => updateAgentProjectField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="h-8 w-full bg-transparent text-sm text-cyan-50 outline-none placeholder:text-cyan-100/24"
                  />
                </motion.label>
              ))}
            </div>

            <div className="px-3 pb-3">
              <div className="rounded-2xl border border-cyan-300/14 bg-black/28 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">Prompts Ganadores</p>
                    <h4 className="mt-1 text-sm font-semibold text-cyan-50">Historial guardado</h4>
                  </div>
                  <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-mono text-cyan-100/70">
                    {winnerPrompts.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {winnerPrompts.length > 0 ? (
                    winnerPrompts.map((item) => (
                      <div key={item.id} className="rounded-xl border border-cyan-300/12 bg-white/5 px-3 py-2">
                        <p className="text-xs font-semibold text-cyan-50">{item.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-cyan-50/60">{item.prompt}</p>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-xs text-cyan-50/45">
                      Sin prompts guardados aún.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-cyan-300/14 px-3 py-2">
              <button
                type="button"
                onClick={() => setActiveAgentName(null)}
                className="rounded-xl border border-red-300/25 bg-red-400/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-100/80 transition hover:bg-red-400/14"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleAgentProjectSubmit}
                disabled={aiLoading}
                className="rounded-xl border border-cyan-300/50 bg-cyan-300/16 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 transition hover:border-emerald-200/60 hover:bg-emerald-300/14 hover:text-emerald-100"
              >
                {aiLoading ? 'Procesando' : 'Llevar metricas'}
              </button>
            </div>
          </motion.div>
        ) : (
        <motion.div
          animate={{
            scale: isFocused ? 1.004 : 1,
            boxShadow: isFocused
              ? '0 0 60px rgba(34,211,238,0.55), 0 0 24px rgba(6,182,212,0.45) inset, 0 18px 40px rgba(0,0,0,0.6)'
              : '0 0 32px rgba(34,211,238,0.30), 0 0 16px rgba(6,182,212,0.25) inset, 0 14px 28px rgba(0,0,0,0.55)',
          }}
          transition={{ duration: 0.25 }}
          className="relative mx-auto flex w-full max-w-[min(95vw,1360px)] flex-col gap-0 overflow-visible rounded-[28px]"
          style={{
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-cyan-200/8 via-fuchsia-200/4 to-transparent" />

          {/* Status LEDs */}
          <div className="relative px-2 pt-1 pb-1">
            <div
              className="inline-flex items-center rounded-[16px] border border-slate-200/26 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_rgba(0,0,0,0.18)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(196,201,208,0.30) 0%, rgba(128,136,148,0.20) 48%, rgba(64,72,84,0.16) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <StatusLEDs isThinking={aiLoading} />
            </div>
          </div>

          {/* Textarea row */}
          <div className="eq-spectrum-box relative mx-0 my-0 rounded-[24px] border border-white/20 px-4 py-2 sm:px-5" style={{ background: 'rgba(0, 0, 0, 0.89)', boxShadow: '0 14px 24px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <div className="pointer-events-none absolute inset-[3px] rounded-[21px] border border-slate-200/26 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]" />

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={t('chat.placeholder')}
              disabled={aiLoading}
              autoFocus
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-foreground/95 text-xl font-display placeholder:text-muted-foreground/30 leading-relaxed scrollbar-thin caret-primary overflow-y-auto text-center sm:text-left"
              style={{ minHeight: '24px', maxHeight: '120px', caretColor: 'hsl(var(--primary))', fontSize: '18px' }}
            />
          </div>

          {/* Toolbar */}
          <div className="relative flex items-center justify-between px-3 py-1.5">
            <div
              className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200/26 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_rgba(0,0,0,0.18)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(196,201,208,0.30) 0%, rgba(128,136,148,0.20) 48%, rgba(64,72,84,0.16) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setToolsOpen(v => !v)}
                title="Centro de Herramientas"
                className={`h-7 w-7 rounded-xl transition-all duration-300 border ${
                  toolsOpen
                    ? 'text-cyan-200 bg-cyan-400/20 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                    : 'text-cyan-300/80 bg-cyan-400/5 border-cyan-400/30 hover:bg-cyan-400/15 hover:text-cyan-200'
                }`}
              >
                <Plus className="w-4 h-4" />
              </Button>

              {SelectedInlineToolIcon && selectedInlineTool && (
                <div className="inline-flex items-center gap-1 rounded-xl border border-cyan-300/28 bg-black/18 px-2 py-1 text-cyan-100/88 shadow-[0_0_10px_rgba(34,211,238,0.12)]">
                  <SelectedInlineToolIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[110px] truncate text-[10px] font-mono uppercase tracking-[0.14em]">
                    {selectedInlineTool.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('eq:inline-tool-clear-request'))}
                    className="rounded-md p-0.5 text-cyan-100/58 transition hover:bg-cyan-300/12 hover:text-cyan-50"
                    title="Quitar herramienta"
                    aria-label="Quitar herramienta"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || aiLoading}
              className="h-8 w-8 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] disabled:opacity-30 transition-all duration-300"
            >
              {aiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>
        )}
      </div>

      <MascotTaskDialog
        open={!!mascotTask}
        task={mascotTask}
        onClose={() => { setMascotTask(null); forceFocus(); }}
        onExecute={async (action, task) => {
          setMascotTask(null);
          if (action === 'schedule') {
            toast({ title: 'Programado', description: task });
            forceFocus();
            return;
          }
          if (action === 'delegate') {
            window.dispatchEvent(new CustomEvent('eq:open-squad', { detail: { task } }));
            toast({ title: 'Delegado al SQUAD', description: task });
            forceFocus();
            return;
          }
          // Execute now: send through chat
          const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: task, timestamp: new Date() };
          setMessages(prev => [...prev, userMsg]);
          forceFocus();
          try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const result = await sendMessage(task, history, activeAgentId || undefined);
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: result.response,
              timestamp: new Date(),
              model: typeof result.meta?.effectiveModel === 'string'
                ? result.meta.effectiveModel
                : typeof result.meta?.model === 'string'
                  ? result.meta.model
                  : undefined,
            }]);
          } catch (e) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: t('chat.error'), timestamp: new Date() }]);
          }
        }}
      />
    </div>
  );
};
