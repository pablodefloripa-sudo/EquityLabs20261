import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GhostTyperProps {
  text: string;
  isActive: boolean;
  visualScale: number;
}

export const GhostTyper = ({ text, isActive, visualScale }: GhostTyperProps) => {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerScale = Math.max(0.7, Number((1.02 - Math.max(0, visualScale - 1) * 0.72).toFixed(2)));
  const textScale = Math.max(0.72, Number((1 - Math.max(0, visualScale - 1) * 0.58).toFixed(2)));
  const bannerWidth = `${Math.max(62, Number((96 - Math.max(0, visualScale - 1) * 44).toFixed(2)))}vw`;

  useEffect(() => {
    setDisplayed('');
    if (!isActive || !text) return;

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 35 + Math.random() * 25);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, isActive]);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full px-4 py-3 font-mono tracking-normal sm:px-6"
    >
      <div
        className="mx-auto rounded-lg border border-cyan-400/30 bg-black/50 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5"
        style={{
          boxShadow: '0 0 25px rgba(34,211,238,0.15)',
          maxWidth: bannerWidth,
          transform: `scale(${bannerScale})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <div className="w-2 h-2 rounded-full bg-green-500/70" />
          <span className="text-[10px] sm:text-xs text-cyan-300/50 ml-2 font-mono">equitylabs://agent-core</span>
        </div>
        <div
          className="min-h-[2.4em] font-mono leading-tight text-cyan-300"
          style={{
            textShadow: '0 0 12px rgba(34,211,238,0.5)',
            fontSize: `clamp(1.3rem, ${2.7 * textScale}vw, ${3.3 * textScale}rem)`,
          }}
        >
          <span className="text-cyan-400/70 mr-2">{'>'}</span>
          <span>{displayed}</span>
          <span className={`inline-block w-[3px] h-[1em] bg-cyan-300 ml-[2px] align-middle transition-opacity ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>
    </motion.div>
  );
};
