import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Image as ImageIcon, Layout, Telescope, Clapperboard, Music,
  GraduationCap, Sparkles, FileBarChart, TrendingUp,
  BarChart3, Cat, Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MascotCreatorModal } from './MascotCreatorModal';

type ToolKey =
  | 'create_image' | 'canvas_organize' | 'deep_research' | 'create_video_brief'
  | 'create_music_brief' | 'learn' | 'prompt_engineer' | 'generate_report' | 'market_analysis'
  | 'project_metrics' | 'mascot';

interface ToolDef {
  key: ToolKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  placeholder: string;
  category: 'core' | 'equity';
  accent: string;
}

const TOOLS: ToolDef[] = [
  { key: 'create_image', label: 'Crear imagen', icon: ImageIcon, description: 'IA generativa', placeholder: 'Describe la imagen...', category: 'core', accent: 'from-cyan-500/25 to-blue-500/15 border-cyan-400/40' },
  { key: 'canvas_organize', label: 'Canvas', icon: Layout, description: 'Mapa mental', placeholder: 'Pega tus notas...', category: 'core', accent: 'from-blue-500/25 to-indigo-500/15 border-blue-400/40' },
  { key: 'deep_research', label: 'Deep Research', icon: Telescope, description: 'Investigación', placeholder: '¿Qué investigar?', category: 'core', accent: 'from-indigo-500/25 to-purple-500/15 border-indigo-400/40' },
  { key: 'create_video_brief', label: 'Vídeo', icon: Clapperboard, description: 'Brief producción', placeholder: 'Describe el video...', category: 'core', accent: 'from-purple-500/25 to-fuchsia-500/15 border-purple-400/40' },
  { key: 'create_music_brief', label: 'Música', icon: Music, description: 'Brief musical', placeholder: 'Describe la canción...', category: 'core', accent: 'from-fuchsia-500/25 to-pink-500/15 border-fuchsia-400/40' },
  { key: 'learn', label: 'Learn', icon: GraduationCap, description: 'Roadmap', placeholder: '', category: 'core', accent: 'from-emerald-500/25 to-teal-500/15 border-emerald-400/40' },
  { key: 'prompt_engineer', label: 'Prompt Eng.', icon: Sparkles, description: 'Prompts óptimos', placeholder: 'Qué quieres lograr...', category: 'equity', accent: 'from-yellow-500/25 to-amber-500/15 border-yellow-400/40' },
  { key: 'generate_report', label: 'Reporte', icon: FileBarChart, description: 'Ejecutivo', placeholder: '¿Sobre qué tema?', category: 'equity', accent: 'from-orange-500/25 to-red-500/15 border-orange-400/40' },
  { key: 'market_analysis', label: 'Mercado', icon: TrendingUp, description: 'TAM/SAM/SOM', placeholder: 'Empresa o sector...', category: 'equity', accent: 'from-red-500/25 to-rose-500/15 border-red-400/40' },
  { key: 'project_metrics', label: 'Métricas', icon: BarChart3, description: 'KPIs proyecto', placeholder: 'Nombre y contexto...', category: 'equity', accent: 'from-teal-500/25 to-cyan-500/15 border-teal-400/40' },
  { key: 'mascot', label: 'Mascota IA', icon: Cat, description: 'Companion', placeholder: '', category: 'equity', accent: 'from-pink-500/30 to-fuchsia-500/20 border-pink-400/50' },
];

interface InlineToolsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const InlineToolsPanel = ({ open, onClose }: InlineToolsPanelProps) => {
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
  const [mascotOpen, setMascotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const clearSelectedTool = () => {
    setSelectedTool(null);
    setLoading(false);
    window.dispatchEvent(new CustomEvent('eq:inline-tool-cleared'));
  };

  const handlePick = (tool: ToolDef) => {
    onClose();
    if (tool.key === 'learn') {
      window.dispatchEvent(new CustomEvent('open-ultralearning-roadmap'));
      toast({ title: 'Ultralearning Roadmap', description: 'Abriendo...' });
      return;
    }
    if (tool.key === 'mascot') { setMascotOpen(true); return; }
    setSelectedTool(tool);
    window.dispatchEvent(new CustomEvent('eq:inline-tool-selected', {
      detail: { key: tool.key, label: tool.label },
    }));
  };

  useEffect(() => {
    const handleRunSelectedTool = async (event: Event) => {
      const detail = (event as CustomEvent<{
        prompt?: string;
        preferredModel?: string;
        agentId?: string;
      }>).detail || {};
      const prompt = detail.prompt?.trim();
      const preferredModel = detail.preferredModel?.trim();

      if (!selectedTool || !prompt || loading) return;

      setLoading(true);
      window.dispatchEvent(new CustomEvent('eq:tool-user-prompt', {
        detail: { tool: selectedTool.label, prompt },
      }));

      try {
        if (selectedTool.key === 'create_image') {
          const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
              prompt,
              preferredModel,
              agentId: detail.agentId || null,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          window.dispatchEvent(new CustomEvent('eq:tool-result', {
            detail: {
              tool: selectedTool.label,
              model: data.model || preferredModel || 'image-generation',
              imageUrl: data.imageUrl,
            },
          }));
        } else {
          const dashboardContext = (window as unknown as {
            __eqDashboardContext?: {
              subscription?: { key?: string; tier?: string; displayPlan?: string };
              activeAgent?: { id?: string; name?: string; engine?: string };
            };
          }).__eqDashboardContext;

          const { data, error } = await supabase.functions.invoke('tools-ai', {
            body: {
              tool: selectedTool.key,
              prompt,
              preferredModel,
              agentId: detail.agentId || dashboardContext?.activeAgent?.id || null,
              subscriptionPlan: dashboardContext?.subscription?.displayPlan || dashboardContext?.subscription?.key || null,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          window.dispatchEvent(new CustomEvent('eq:tool-result', {
            detail: {
              tool: selectedTool.label,
              model: data.model || preferredModel || 'gemini-2.5-flash',
              content: data.content,
            },
          }));
        }
        clearSelectedTool();
      } catch (e) {
        toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
        setLoading(false);
      }
    };

    const handleClear = () => clearSelectedTool();

    window.addEventListener('eq:run-selected-tool', handleRunSelectedTool);
    window.addEventListener('eq:inline-tool-clear-request', handleClear);
    return () => {
      window.removeEventListener('eq:run-selected-tool', handleRunSelectedTool);
      window.removeEventListener('eq:inline-tool-clear-request', handleClear);
    };
  }, [loading, selectedTool, toast]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 bottom-[calc(100%+8px)] z-30 rounded-2xl overflow-hidden border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.25)]"
            style={{
              background: 'linear-gradient(160deg, rgba(8,145,178,0.18) 0%, rgba(6,182,212,0.10) 40%, rgba(0,0,0,0.85) 100%)',
              backdropFilter: 'blur(28px) saturate(160%)',
              WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground tracking-tight">Centro de Herramientas</h3>
                  <p className="text-[9px] text-muted-foreground/70 font-mono uppercase tracking-widest">CoreSettings</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Tools grid — single section, fits without scroll */}
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                {TOOLS.map(t => {
                  const Icon = t.icon;
                  const isMascot = t.key === 'mascot';
                  return (
                    <button
                      key={t.key}
                      onClick={() => handlePick(t)}
                      className={`group relative text-left p-2.5 rounded-xl bg-gradient-to-br ${t.accent} backdrop-blur-md hover:scale-[1.05] transition-all border ${
                        isMascot ? 'hover:shadow-[0_0_18px_rgba(236,72,153,0.5)]' : 'hover:shadow-[0_0_18px_rgba(34,211,238,0.4)]'
                      }`}
                      title={t.description}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${isMascot ? 'text-pink-200' : 'text-cyan-100'}`} />
                      <h4 className="text-[10px] font-bold text-white leading-tight">{t.label}</h4>
                      <p className="text-[9px] text-white/55 leading-tight mt-0.5 truncate">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MascotCreatorModal open={mascotOpen} onClose={() => setMascotOpen(false)} />
    </>
  );
};
