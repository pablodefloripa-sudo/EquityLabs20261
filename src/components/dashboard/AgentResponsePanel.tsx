import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, Cpu, Sparkles, ArrowRight } from 'lucide-react';

interface AgentResponsePanelProps {
  content: string;
  model?: string;
  mascot?: boolean;
}

// Extract sections by markers if present, otherwise split heuristically
const parseSections = (content: string) => {
  const reasoningRx = /(?:^|\n)#{0,3}\s*(?:razonamiento|reasoning|analysis|análisis)\s*:?\s*\n?/i;
  const executionRx = /(?:^|\n)#{0,3}\s*(?:ejecución|ejecucion|execution|respuesta|response)\s*:?\s*\n?/i;
  const nextRx = /(?:^|\n)#{0,3}\s*(?:next\s*step|próximo\s*paso|proximo\s*paso|siguiente\s*paso|siguientes\s*pasos|next\s*steps)\s*:?\s*\n?/i;

  const rIdx = content.search(reasoningRx);
  const eIdx = content.search(executionRx);
  const nIdx = content.search(nextRx);

  if (rIdx >= 0 || eIdx >= 0 || nIdx >= 0) {
    const cuts = [
      { key: 'reasoning', idx: rIdx },
      { key: 'execution', idx: eIdx },
      { key: 'next', idx: nIdx },
    ].filter(c => c.idx >= 0).sort((a, b) => a.idx - b.idx);

    const out: Record<string, string> = { reasoning: '', execution: '', next: '' };
    cuts.forEach((c, i) => {
      const start = c.idx;
      const end = i + 1 < cuts.length ? cuts[i + 1].idx : content.length;
      const slice = content.slice(start, end).replace(/^[^\n]*\n?/, '').trim();
      out[c.key] = slice;
    });
    if (!out.execution && !out.reasoning) out.execution = content;
    return out;
  }

  // Heuristic: 25% reasoning, 65% execution, 10% next
  const paragraphs = content.split('\n\n').filter(Boolean);
  if (paragraphs.length <= 1) {
    return { reasoning: '', execution: content, next: '' };
  }
  const rEnd = Math.max(1, Math.floor(paragraphs.length * 0.25));
  const nStart = Math.max(rEnd + 1, Math.floor(paragraphs.length * 0.9));
  return {
    reasoning: paragraphs.slice(0, rEnd).join('\n\n'),
    execution: paragraphs.slice(rEnd, nStart).join('\n\n'),
    next: paragraphs.slice(nStart).join('\n\n'),
  };
};

// Strip markdown emphasis, headings and emojis from rendered text
const sanitize = (s: string): string => {
  if (!s) return s;
  return s
    // remove emojis & pictographs
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/gu, '')
    // strip ATX headings markers (# ## ###) at line start
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    // strip bold/italic asterisks and underscores wrappers but keep inner text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // remove stray asterisks/hashes
    .replace(/[*#]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

export const AgentResponsePanel = ({ content, model = 'gemini-2.5-flash', mascot = false }: AgentResponsePanelProps) => {
  const clean = sanitize(content);
  const parsed = parseSections(clean);
  const reasoning = sanitize(parsed.reasoning);
  const execution = sanitize(parsed.execution);
  const next = sanitize(parsed.next);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-[98%] relative group"
    >
      {/* Outer neon glow */}
      <div className={`absolute -inset-px rounded-xl blur-[1px] ${mascot ? 'bg-gradient-to-br from-pink-500/50 via-fuchsia-500/40 to-rose-500/40' : 'bg-gradient-to-br from-green-500/30 via-orange-500/20 to-cyan-500/20'}`} />

      <div className={`relative backdrop-blur-xl rounded-xl border p-4 overflow-hidden ${mascot ? 'bg-pink-950/50 border-pink-400/40 shadow-[0_0_30px_rgba(236,72,153,0.25)]' : 'bg-black/70 border-border/30'}`}>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Model tag */}
        <div className="flex items-center gap-1.5 mb-3 relative z-10">
          <Cpu className="w-3 h-3 text-yellow-500/70" />
          <span className="text-[9px] font-mono text-yellow-500/70 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
            {model}
          </span>
          <motion.div
            className="ml-auto w-2 h-2 rounded-full bg-green-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        {/* Reasoning section - GREEN */}
        {reasoning && (
          <section className="relative z-10 mb-4">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-green-500/20">
              <Brain className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-mono font-bold text-green-400 tracking-widest uppercase">
                Razonamiento
              </span>
            </div>
            <div className="text-[12px] text-green-100/80 font-mono leading-relaxed pl-1 border-l-2 border-green-500/30 pl-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoning}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Execution section */}
        {execution && (
          <section className="relative z-10 mb-4">
            <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${mascot ? 'border-pink-400/30' : 'border-orange-500/20'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${mascot ? 'text-pink-300' : 'text-orange-400'}`} />
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${mascot ? 'text-pink-300' : 'text-orange-400'}`}>
                {mascot ? 'Mascota' : 'Ejecución'}
              </span>
            </div>
            <div className={`chat-markdown prose prose-invert prose-sm max-w-none pl-3 border-l-2 ${mascot ? 'text-pink-50/95 border-pink-400/40' : 'text-foreground/90 border-orange-500/30'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{execution}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Next Step section - CYAN */}
        {next && (
          <section className="relative z-10">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-cyan-500/20">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase">
                Next Step
              </span>
            </div>
            <div className="text-[12px] text-cyan-100/85 font-mono leading-relaxed pl-3 border-l-2 border-cyan-500/30">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{next}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-500/40 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-orange-500/40 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 rounded-br-xl" />
      </div>
    </motion.div>
  );
};
