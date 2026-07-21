import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Cpu } from 'lucide-react';

interface AgentResponsePanelProps {
  content: string;
  model?: string;
  mascot?: boolean;
  responseScale?: number;
  isThinking?: boolean;
}

const sanitize = (value: string): string => {
  if (!value) return value;
  return value
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{FE0F}]/gu, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/[*#]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

export const AgentResponsePanel = ({
  content,
  model = 'gemini-2.5-flash',
  mascot = false,
  responseScale = 1,
  isThinking = false,
}: AgentResponsePanelProps) => {
  const clean = sanitize(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full max-w-[min(100%,980px)] group"
      style={{ '--response-scale': responseScale } as CSSProperties}
    >
      <div className={`absolute -inset-px rounded-[22px] blur-[1px] ${mascot ? 'bg-pink-400/18' : 'bg-cyan-300/22'}`} />

      <div
        className={`relative overflow-hidden rounded-[22px] border px-4 py-4 backdrop-blur-2xl ${
          mascot
            ? 'border-pink-300/30 bg-[linear-gradient(180deg,rgba(22,8,24,0.90)_0%,rgba(5,5,8,0.92)_100%)] shadow-[0_0_32px_rgba(236,72,153,0.18),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'border-cyan-300/30 bg-[linear-gradient(180deg,rgba(7,18,34,0.90)_0%,rgba(3,7,14,0.92)_100%)] shadow-[0_0_32px_rgba(34,211,238,0.18),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.08)]'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 0%, rgba(34,211,238,0.12), transparent 26%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.06), transparent 22%)',
          }}
        />

        <div className="relative z-10 mb-4 flex items-center gap-2 font-mono">
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
          <span className="ml-2 text-[10px] text-cyan-200/55">equitylabs://agent-core</span>
          <Cpu className="ml-auto h-3 w-3 text-cyan-300/65" />
          <span className="rounded border border-cyan-400/12 bg-transparent px-1.5 py-0.5 text-[9px] text-cyan-200/62">
            {model}
          </span>
          <motion.div
            className="h-2 w-2 rounded-full bg-cyan-300"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        <div
          className={`relative z-10 border-l-2 pl-4 font-mono text-[clamp(12px,calc(13px*var(--response-scale)),20px)] leading-relaxed ${
            mascot ? 'border-pink-400/30 text-pink-50/92' : 'border-cyan-400/25 text-cyan-50/90'
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>
        </div>

        <div className="absolute top-0 left-0 h-3 w-3 rounded-tl-[22px] border-l border-t border-cyan-400/45" />
        <div className="absolute top-0 right-0 h-3 w-3 rounded-tr-[22px] border-r border-t border-cyan-400/35" />
        <div className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-[22px] border-b border-l border-cyan-400/35" />
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-br-[22px] border-b border-r border-cyan-400/45" />
      </div>
    </motion.div>
  );
};
