import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Trash2, Loader2, ArrowLeft, Copy, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChatSession {
  project_id: string;
  project_name: string;
  last_message: string;
  message_count: number;
  updated_at: string;
}

interface SessionMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
  model_used: string | null;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal = ({ isOpen, onClose }: HistoryModalProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSession, setOpenSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('project_id, project_name, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const grouped = new Map<string, ChatSession>();
      for (const row of data || []) {
        const pid = row.project_id || 'default';
        if (!grouped.has(pid)) {
          grouped.set(pid, {
            project_id: pid,
            project_name: row.project_name || 'Chat Session',
            last_message: row.content.slice(0, 80),
            message_count: 1,
            updated_at: row.created_at,
          });
        } else {
          grouped.get(pid)!.message_count++;
        }
      }
      setSessions(Array.from(grouped.values()));
    } catch {
      toast({ title: 'Error', description: 'Could not load history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setOpenSession(null);
      setSessionMessages([]);
    }
  }, [isOpen, fetchSessions]);

  const handleDelete = async (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', user.id)
      .eq('project_id', projectId);
    if (!error) {
      setSessions(prev => prev.filter(s => s.project_id !== projectId));
      toast({ title: 'Deleted', description: 'Chat session removed.' });
    }
  };

  const openSessionDetail = async (session: ChatSession) => {
    if (!user) return;
    setOpenSession(session);
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, role, content, created_at, model_used')
        .eq('user_id', user.id)
        .eq('project_id', session.project_id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSessionMessages(data || []);
    } catch {
      toast({ title: 'Error', description: 'Could not load session', variant: 'destructive' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopyAll = async () => {
    const text = sessionMessages
      .map(m => `[${m.role.toUpperCase()}]${m.model_used ? ` (${m.model_used})` : ''}\n${m.content}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleResume = () => {
    if (!openSession || sessionMessages.length === 0) return;
    const payload = sessionMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at).toISOString(),
      }));
    if (payload.length === 0) {
      toast({ title: 'Empty session', description: 'No messages to resume.', variant: 'destructive' });
      return;
    }
    try {
      sessionStorage.setItem('eq_resume_session', JSON.stringify({
        project_id: openSession.project_id,
        project_name: openSession.project_name,
        messages: payload,
      }));
      window.dispatchEvent(new CustomEvent('eq:resume-session', { detail: { project_id: openSession.project_id, messages: payload } }));
      toast({ title: 'Session resumed', description: `${openSession.project_name} loaded into dashboard.` });
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Could not resume session', variant: 'destructive' });
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 modal-cyber w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-cyan-400/15">
              <div className="flex items-center gap-2 min-w-0">
                {openSession && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setOpenSession(null); setSessionMessages([]); }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <h2 className="modal-cyber-title text-sm font-semibold truncate">
                  {openSession ? openSession.project_name : 'History'}
                </h2>
                {openSession && (
                  <span className="text-xs text-muted-foreground/60 ml-2 shrink-0">
                    {formatDate(openSession.updated_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {openSession && sessionMessages.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResume}
                      className="h-7 px-2 text-xs gap-1 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
                      title="Resume in dashboard"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyAll}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Copy entire session"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
              {!openSession && (
                loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : sessions.length === 0 ? (
                  <p className="text-center text-muted-foreground/60 py-8 text-sm">No chat history yet.</p>
                ) : (
                  sessions.map(s => (
                    <button
                      key={s.project_id}
                      onClick={() => openSessionDetail(s)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground/90 truncate">{s.project_name}</p>
                        <p className="text-xs text-muted-foreground/60 truncate">{s.last_message}</p>
                        <p className="text-[10px] text-muted-foreground/40 mt-0.5">{formatDate(s.updated_at)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground/40 shrink-0">{s.message_count} msgs</span>
                      <span
                        role="button"
                        onClick={(e) => handleDelete(s.project_id, e)}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))
                )
              )}

              {openSession && (
                loadingDetail ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : sessionMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground/60 py-8 text-sm">Empty session.</p>
                ) : (
                  sessionMessages.map(m => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border ${
                        m.role === 'user'
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/20 border-border/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${
                          m.role === 'user' ? 'text-primary' : 'text-cyan-300'
                        }`}>
                          {m.role}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">
                          {formatDate(m.created_at)}
                          {m.model_used ? ` · ${m.model_used}` : ''}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  ))
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
