import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight, Brain, Cpu, Sparkles } from 'lucide-react';

interface AgentResponsePanelProps {
  content: string;
  model?: string;
  mascot?: boolean;
  responseScale?: number;
  isThinking?: boolean;
}

const parseSections = (content: string) => {
  const reasoningRx = /(?:^|\n)#{0,3}\s*(?:razonamiento|reasoning|analysis|analisis)\s*:?\s*\n?/i;
  const executionRx = /(?:^|\n)#{0,3}\s*(?:ejecucion|execution|respuesta|response)\s*:?\s*\n?/i;
  const nextRx = /(?:^|\n)#{0,3}\s*(?:next\s*step|proximo\s*paso|siguiente\s*paso|siguientes\s*pasos|next\s*steps)\s*:?\s*\n?/i;

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
      out[c.key] = content.slice(start, end).replace(/^[^\n]*\n?/, '').trim();
    });

    if (!out.execution && !out.reasoning) out.execution = content;
    return out;
  }

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

const sanitize = (s: string): string => {
  if (!s) return s;
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/gu, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/[*#]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const Section = ({
  icon,
  title,
  children,
  mascot,
}: {
  icon: ReactNode;
  title: string;
  children: string;
  mascot?: boolean;
}) => (
  <section className="relative z-10 mb-4 last:mb-0">
    <div className={`mb-2 flex items-center gap-2 border-b pb-1.5 ${mascot ? 'border-pink-400/25' : 'border-cyan-400/15'}`}>
      {icon}
      <span className={`text-[10px] font-bold uppercase tracking-widest ${mascot ? 'text-pink-300' : 'text-cyan-300'}`}>
        {title}
      </span>
    </div>
    <div className={`chat-markdown prose prose-invert max-w-none border-l-2 pl-3 font-mono text-[clamp(12px,calc(13px*var(--response-scale)),20px)] leading-relaxed ${mascot ? 'border-pink-400/35 text-pink-50/92' : 'border-cyan-400/25 text-cyan-50/88'}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  </section>
);

export const AgentResponsePanel = ({
  content,
  model = 'gemini-2.5-flash',
  mascot = false,
  responseScale = 1,
  isThinking = false,
}: AgentResponsePanelProps) => {
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
      className="relative w-full max-w-[min(100%,980px)] group"
      style={{ '--response-scale': responseScale } as CSSProperties}
    >
      <div className="absolute -inset-px rounded-lg bg-cyan-400/25 blur-[1px]" />

      <div
        className={`relative overflow-hidden rounded-lg border p-4 backdrop-blur-xl ${
          mascot
            ? 'border-pink-300/35 bg-pink-950/45 shadow-[0_0_30px_rgba(236,72,153,0.22)]'
            : 'border-cyan-400/30 bg-black/58 shadow-[0_0_26px_rgba(34,211,238,0.16)]'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(34,211,238,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.45) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 mb-3 flex items-center gap-2 font-mono">
          {([
            ['bg-red-500/80', 'rgba(239,68,68,0.75)'],
            ['bg-yellow-500/80', 'rgba(234,179,8,0.75)'],
            ['bg-green-500/80', 'rgba(34,197,94,0.75)'],
          ] as const).map(([colorClass, glow], index) => (
            <motion.div
              key={colorClass}
              className={`h-2.5 w-2.5 rounded-full ${colorClass}`}
              style={{ boxShadow: `0 0 6px ${glow}` }}
              animate={isThinking ? { opacity: [0.25, 1, 0.25], scale: [0.88, 1.15, 0.88] } : { opacity: 0.85, scale: 1 }}
              transition={isThinking ? { duration: 0.85, repeat: Infinity, delay: index * 0.16 } : { duration: 0.2 }}
            />
          ))}
          <span className="ml-2 text-[10px] text-cyan-300/55">equitylabs://agent-response</span>
          <Cpu className="ml-auto h-3 w-3 text-cyan-300/65" />
          <span className="rounded border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] text-cyan-200/70">
            {model}
          </span>
          <motion.div
            className="h-2 w-2 rounded-full bg-cyan-300"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        {reasoning && (
          <Section icon={<Brain className="h-3.5 w-3.5 shrink-0 text-cyan-300" />} title="Razonamiento" mascot={mascot}>
            {reasoning}
          </Section>
        )}

        {execution && (
          <Section icon={<Sparkles className={`h-3.5 w-3.5 shrink-0 ${mascot ? 'text-pink-300' : 'text-cyan-300'}`} />} title={mascot ? 'Mascota' : 'Ejecucion'} mascot={mascot}>
            {execution}
          </Section>
        )}

        {next && (
          <Section icon={<ArrowRight className="h-3.5 w-3.5 shrink-0 text-cyan-300" />} title="Next Step" mascot={mascot}>
            {next}
          </Section>
        )}

        <div className="absolute top-0 left-0 h-3 w-3 rounded-tl-lg border-l border-t border-cyan-400/45" />
        <div className="absolute top-0 right-0 h-3 w-3 rounded-tr-lg border-r border-t border-cyan-400/35" />
        <div className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-lg border-b border-l border-cyan-400/35" />
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-br-lg border-b border-r border-cyan-400/45" />
      </div>
    </motion.div>
  );
};
