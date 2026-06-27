import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Volume2, VolumeX, Loader2, ThumbsUp, ThumbsDown, Trash2, Cpu, Plus } from 'lucide-react';
import { InlineToolsPanel } from './InlineToolsPanel';
import { AgentResponsePanel } from './AgentResponsePanel';
import { MascotGreeting } from './MascotGreeting';
import { MascotTaskDialog } from './MascotTaskDialog';
import { Button } from '@/components/ui/button';
import { VoiceWaveform } from './VoiceWaveform';

import { useAIChat } from '@/hooks/useAIChat';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
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
}

interface CommunicationAreaProps {
  onEnterFocusMode: () => void;
}

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

export const CommunicationArea = ({ onEnterFocusMode }: CommunicationAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [mascotTask, setMascotTask] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const { sendMessage, isLoading: aiLoading } = useAIChat();
  const { speak, isSpeaking, isReady: ttsReady, stop: stopSpeaking } = useKokoroTTS();

  const getWaveformState = (): 'idle' | 'thinking' | 'speaking' => {
    if (isSpeaking) return 'speaking';
    if (aiLoading) return 'thinking';
    return 'idle';
  };

  // Permanent auto-focus
  const forceFocus = useCallback(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => { forceFocus(); }, [forceFocus]);

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

      if (ttsReady && soundEnabled) {
        await speak(response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSound = () => {
    if (isSpeaking) stopSpeaking();
    setSoundEnabled(!soundEnabled);
    forceFocus();
  };

  return (
    <div className="flex flex-col flex-1 justify-end min-h-0 mx-auto w-full px-[57px]">
      {/* Waveform */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-48 z-10">
        <VoiceWaveform state={getWaveformState()} />
      </div>

      {/* Messages */}
      <div className="flex flex-col flex-1 justify-end px-1 pb-0 min-h-0" style={{ marginBottom: 0 }}>
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-2"
          >
            <p className="text-muted-foreground/40 text-xs font-mono tracking-widest">{t('chat.start')}</p>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin mb-1 max-h-[75vh]">
            <div className="space-y-3 w-full">
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
                        <AgentResponsePanel content={msg.content} model={msg.model} mascot={msg.mascot} />
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
      <div className="w-full px-[1px] pb-2 relative">
        <InlineToolsPanel open={toolsOpen} onClose={() => setToolsOpen(false)} />
        <motion.div
          animate={{
            scale: isFocused ? 1.004 : 1,
            boxShadow: isFocused
              ? '0 0 60px rgba(34,211,238,0.55), 0 0 24px rgba(6,182,212,0.45) inset, 0 18px 40px rgba(0,0,0,0.6)'
              : '0 0 32px rgba(34,211,238,0.30), 0 0 16px rgba(6,182,212,0.25) inset, 0 14px 28px rgba(0,0,0,0.55)',
          }}
          transition={{ duration: 0.25 }}
          className="relative flex flex-col gap-0 rounded-2xl overflow-hidden border border-cyan-300/60"
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
          <div className="relative px-3 py-3 mx-2 my-1 rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(0,20,30,0.92) 0%, rgba(0,12,20,0.95) 100%)', boxShadow: 'inset 0 1px 0 rgba(34,211,238,0.35), inset 0 -1px 0 rgba(0,0,0,0.6)' }}>

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
              className="w-full bg-transparent border-none outline-none resize-none text-foreground/90 text-lg font-display placeholder:text-muted-foreground/30 leading-relaxed scrollbar-thin caret-primary overflow-y-auto"
              style={{ minHeight: '28px', maxHeight: '164px', caretColor: 'hsl(var(--primary))', fontSize: '18px' }}
            />
          </div>

          {/* Toolbar */}
          <div className="relative flex items-center justify-between px-3 py-2" style={{ background: 'linear-gradient(180deg, rgba(8,145,178,0.12) 0%, rgba(0,0,0,0.55) 100%)', boxShadow: 'inset 0 1px 0 rgba(34,211,238,0.25)' }}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSound}
                className={`h-8 w-8 rounded-xl transition-all duration-300 ${
                  soundEnabled
                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

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
            if (ttsReady && soundEnabled) await speak(response);
          } catch (e) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: t('chat.error'), timestamp: new Date() }]);
          }
        }}
      />
    </div>
  );
};
