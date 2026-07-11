import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, ThumbsUp, ThumbsDown, Trash2, Cpu, Plus, ShieldCheck, BarChart3 } from 'lucide-react';
import { InlineToolsPanel } from './InlineToolsPanel';
import { AgentResponsePanel } from './AgentResponsePanel';
import { MascotGreeting } from './MascotGreeting';
import { MascotTaskDialog } from './MascotTaskDialog';
import { Button } from '@/components/ui/button';
import { VoiceWaveform } from './VoiceWaveform';

import { useAIChat } from '@/hooks/useAIChat';
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
    proposals: string[];
  };
}

interface CommunicationAreaProps {
  onEnterFocusMode: () => void;
}

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

const buildAgentCommand = (agentName: string, tasks: string[], engine: string) => {
  const safeTasks = tasks.length ? tasks : ['Buscar norte estrategico', 'Implementar agentes necesarios', 'Auditar rendimiento y permisos'];
  const proposals = [
    `Buscar norte: diagnosticar objetivo, restricciones, oportunidad y primer indicador de exito para ${agentName}.`,
    `Implementar squad: activar ${agentName} como agente lider y sumar agentes de soporte segun proyecto, permisos y riesgo.`,
    `Control operativo: abrir proyecto con metricas de rendimiento, auditoria, permisos del usuario y checkpoints de avance.`,
  ];

  return {
    proposals,
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
      'Ya entiendo que este agente fue elegido como punto de entrada. No voy a pedir Gmail, Drive, Calendar o Sheets hasta que una accion concreta lo necesite.',
      '',
      '**Tres propuestas de trabajo inmediato:**',
      '',
      `1. ${proposals[0]}`,
      `2. ${proposals[1]}`,
      `3. ${proposals[2]}`,
      '',
      '**Arquitectura de ejecucion:** norte estrategico, agentes necesarios, proyecto abierto, metricas, auditoria, control y permisos bajo demanda.',
    ].join('\n'),
  };
};

export const CommunicationArea = ({ onEnterFocusMode }: CommunicationAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [mascotTask, setMascotTask] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [responseScale, setResponseScale] = useState(1);
  const [activeAgentName, setActiveAgentName] = useState<string | null>(null);
  const [agentProjectForm, setAgentProjectForm] = useState<AgentProjectForm>(emptyAgentProjectForm);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  
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
    const handleAgentSelected = (event: Event) => {
      const detail = (event as CustomEvent<{
        id?: string;
        name?: string;
        tasks?: string[];
        engine?: string;
      }>).detail || {};
      const agentName = detail.name || 'Agente';
      const command = buildAgentCommand(agentName, detail.tasks || [], detail.engine || 'FREE');
      const subscriptionRaw = localStorage.getItem('eq_subscription_context');
      const subscription = subscriptionRaw ? JSON.parse(subscriptionRaw) : null;
      (window as unknown as {
        __eqDashboardContext?: unknown;
      }).__eqDashboardContext = {
        activeAgent: {
          id: detail.id,
          name: agentName,
          engine: detail.engine || 'FREE',
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
        model: detail.engine || 'agent-router',
        agentCommand: {
          agentName,
          proposals: command.proposals,
        },
      }]);
      setInputValue('');
      setActiveAgentName(agentName);
      setAgentProjectForm(emptyAgentProjectForm);
      setToolsOpen(false);
    };

    window.addEventListener('eq:agent-selected', handleAgentSelected);
    return () => window.removeEventListener('eq:agent-selected', handleAgentSelected);
  }, [forceFocus]);

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
      const response = await sendMessage(currentInput, history);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
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
    const currentAgentName = activeAgentName;
    const currentInput = [
      `Activar ${currentAgentName} con este proyecto y llevar metricas operativas.`,
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
      const response = await sendMessage(currentInput, history);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        model: currentAgentName,
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

  return (
    <div className="flex flex-col flex-1 justify-end min-h-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Waveform */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-48 z-10">
        <VoiceWaveform state={getWaveformState()} />
      </div>

      {/* Messages */}
      <div className="flex flex-col flex-1 justify-end px-1 pb-0 min-h-0">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-2"
          >
            <p className="text-muted-foreground/40 text-xs font-mono tracking-widest">{t('chat.start')}</p>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin mb-1 max-h-[72vh]">
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
                                Permisos bajo demanda
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
                    <div className="max-w-[80%] p-4 rounded-2xl text-sm bg-primary/20 text-foreground/90 border border-primary/30">
                      {msg.content}
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Command Console - flush to bottom with 0.5rem margin */}
      <div className="relative w-full pb-2">
        <InlineToolsPanel open={toolsOpen} onClose={() => setToolsOpen(false)} />
        {activeAgentName ? (
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/12 text-cyan-200">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold tracking-wide text-cyan-50">
                    {activeAgentName}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/60">
                    Formulario de metricas
                  </p>
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
          className="relative mx-auto flex w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-cyan-300/60"
          style={{
            background: 'linear-gradient(160deg, rgba(8,145,178,0.18) 0%, rgba(6,182,212,0.10) 40%, rgba(0,0,0,0.55) 100%)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          }}
        >
          {/* 3D top highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-cyan-200/15 to-transparent" />
          {/* 3D bottom shadow */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          {/* Glow ring */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />

          {/* Status LEDs */}
          <div className="relative px-3 pt-3 pb-2">
            <StatusLEDs isThinking={aiLoading} />
          </div>

          {/* Textarea row — vivid cyan-tinted black */}
          <div className="relative mx-2 my-1 rounded-2xl px-4 py-4 sm:px-5" style={{ background: 'linear-gradient(180deg, rgba(0,20,30,0.92) 0%, rgba(0,12,20,0.95) 100%)', boxShadow: 'inset 0 1px 0 rgba(34,211,238,0.35), inset 0 -1px 0 rgba(0,0,0,0.6)' }}>

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
              style={{ minHeight: '36px', maxHeight: '184px', caretColor: 'hsl(var(--primary))', fontSize: '20px' }}
            />
          </div>

          {/* Toolbar */}
          <div className="relative flex items-center justify-between px-3 py-2" style={{ background: 'linear-gradient(180deg, rgba(8,145,178,0.12) 0%, rgba(0,0,0,0.55) 100%)', boxShadow: 'inset 0 1px 0 rgba(34,211,238,0.25)' }}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setToolsOpen(v => !v)}
                title="Centro de Herramientas"
                className={`h-8 w-8 rounded-xl transition-all duration-300 border ${
                  toolsOpen
                    ? 'text-cyan-200 bg-cyan-400/20 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                    : 'text-cyan-300/80 bg-cyan-400/5 border-cyan-400/30 hover:bg-cyan-400/15 hover:text-cyan-200'
                }`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || aiLoading}
              className="h-10 w-10 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] disabled:opacity-30 transition-all duration-300"
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
            const response = await sendMessage(task, history);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: response, timestamp: new Date() }]);
          } catch (e) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: t('chat.error'), timestamp: new Date() }]);
          }
        }}
      />
    </div>
  );
};
