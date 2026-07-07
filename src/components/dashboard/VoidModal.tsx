import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, ExternalLink, Plus, Trash2, Sparkles, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface VoidModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Tool = { name: string; url: string; category: string; custom?: boolean };

const DEFAULT_TOOLS: Tool[] = [
  { name: "Ideogram 2.0", url: "https://ideogram.ai", category: "Imágenes" },
  { name: "Flux.1 Pro", url: "https://flux1.ai", category: "Imágenes" },
  { name: "Leonardo.AI", url: "https://leonardo.ai", category: "Imágenes" },
  { name: "Grok Imagine", url: "https://grok.x.ai", category: "Imágenes" },
  { name: "Claude 4 Sonnet", url: "https://claude.ai", category: "Chat / Reasoning" },
  { name: "Grok 4", url: "https://grok.x.ai", category: "Chat / Reasoning" },
  { name: "DeepSeek R1", url: "https://deepseek.com", category: "Chat / Reasoning" },
  { name: "Suno v4", url: "https://suno.com", category: "Música" },
  { name: "Udio", url: "https://udio.com", category: "Música" },
  { name: "Kling AI 2.0", url: "https://kling.ai", category: "Video" },
  { name: "Runway Gen-3", url: "https://runwayml.com", category: "Video" },
  { name: "Luma Dream Machine", url: "https://lumalabs.ai", category: "Video" },
  { name: "ElevenLabs", url: "https://elevenlabs.io", category: "Voz" },
  { name: "Play.ht", url: "https://play.ht", category: "Voz" },
  { name: "Perplexity Pro", url: "https://perplexity.ai", category: "Otros Potentes" },
  { name: "Cursor", url: "https://cursor.com", category: "Otros Potentes" },
  { name: "Midjourney (Discord)", url: "https://midjourney.com", category: "Otros Potentes" },
  { name: "Meshy.ai (3D)", url: "https://meshy.ai", category: "Otros Potentes" },
  { name: "Black Forest Labs (Flux)", url: "https://blackforestlabs.ai", category: "Otros Potentes" },
];

const STORAGE_KEY = "void_custom_tools_v1";

const CATEGORY_ACCENT: Record<string, string> = {
  "Imágenes": "from-cyan-400/20 to-cyan-400/0 text-cyan-300 border-cyan-400/30",
  "Chat / Reasoning": "from-purple-400/20 to-purple-400/0 text-purple-300 border-purple-400/30",
  "Música": "from-pink-400/20 to-pink-400/0 text-pink-300 border-pink-400/30",
  "Video": "from-emerald-400/20 to-emerald-400/0 text-emerald-300 border-emerald-400/30",
  "Voz": "from-amber-400/20 to-amber-400/0 text-amber-300 border-amber-400/30",
  "Otros Potentes": "from-fuchsia-400/20 to-fuchsia-400/0 text-fuchsia-300 border-fuchsia-400/30",
  "Personal": "from-white/20 to-white/0 text-white/80 border-white/30",
};

export const VoidModal = ({ open, onOpenChange }: VoidModalProps) => {
  const [custom, setCustom] = useState<Tool[]>([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Personal");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Tool[]) => {
    setCustom(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const normalizedUrl = useMemo(() => {
    const u = newUrl.trim();
    if (!u) return "";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }, [newUrl]);

  const urlValid = useMemo(() => {
    if (!normalizedUrl) return false;
    try { new URL(normalizedUrl); return true; } catch { return false; }
  }, [normalizedUrl]);

  const nameValid = newName.trim().length >= 2;
  const canSubmit = nameValid && urlValid;

  const addTool = () => {
    if (!canSubmit) return;
    persist([...custom, { name: newName.trim(), url: normalizedUrl, category: newCategory, custom: true }]);
    setNewName(""); setNewUrl(""); setNewCategory("Personal");
  };

  const removeCustom = (idx: number) => {
    const next = custom.filter((_, i) => i !== idx);
    persist(next);
  };


  const tools = [...DEFAULT_TOOLS, ...custom];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[85vw] w-[85vw] h-[85vh] p-0 overflow-hidden border-cyan-400/30 bg-zinc-950/95 backdrop-blur-2xl"
        style={{ boxShadow: "0 0 60px rgba(34,211,238,0.25), inset 0 0 40px rgba(0,0,0,0.7)" }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="px-8 py-5 border-b border-cyan-400/15 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.35)]">
              <Brain className="w-6 h-6 text-cyan-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-display tracking-wider bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                VOID — External Intelligence Network
              </h2>
              <p className="text-xs text-cyan-200/60 tracking-widest uppercase">Biblioteca de IA Premium</p>
            </div>
            <Sparkles className="w-5 h-5 text-cyan-400/60" />
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tools.map((tool, i) => {
                const accent = CATEGORY_ACCENT[tool.category] ?? CATEGORY_ACCENT.Personal;
                return (
                  <motion.div
                    key={`${tool.name}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className={`group relative rounded-xl border bg-gradient-to-br ${accent} backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] transition-all`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-widest opacity-70">{tool.category}</div>
                        <h3 className="text-base font-display text-white truncate">{tool.name}</h3>
                      </div>
                      {tool.custom && (
                        <button
                          onClick={() => removeCustom(i - DEFAULT_TOOLS.length)}
                          className="opacity-40 hover:opacity-100 hover:text-pink-300 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/25 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition"
                    >
                      Abrir <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Add custom */}
          <div className="border-t border-cyan-400/15 px-8 py-5 bg-black/40 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-cyan-300" />
              <span className="text-sm font-display tracking-wide text-cyan-200">
                Agregar tu propia herramienta al VOID
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-cyan-300/70">Nombre</Label>
                <Input
                  placeholder="Ej. Mi IA secreta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTool()}
                  className="bg-white/5 border-cyan-400/25 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-cyan-300/70">URL</Label>
                <div className="relative">
                  <Input
                    placeholder="https://tu-herramienta.ai"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTool()}
                    className="bg-white/5 border-cyan-400/25 text-white placeholder:text-white/30 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400/60 pr-9"
                  />
                  {newUrl && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {urlValid ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-pink-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-cyan-300/70">Categoría</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-white/5 border-cyan-400/25 text-white focus:ring-cyan-400/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950/95 border-cyan-400/30 backdrop-blur-2xl">
                    {Object.keys(CATEGORY_ACCENT).map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-cyan-100 focus:bg-cyan-500/15 focus:text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={addTool}
                disabled={!canSubmit}
                className="bg-cyan-500/15 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-40 disabled:hover:shadow-none h-10"
              >
                <Plus className="w-4 h-4 mr-1" /> Añadir
              </Button>
            </div>
            {newUrl && !urlValid && (
              <p className="mt-2 text-[11px] text-pink-300/80 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> URL inválida — usá un formato como https://ejemplo.com
              </p>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};
