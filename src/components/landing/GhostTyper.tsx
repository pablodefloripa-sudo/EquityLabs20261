import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GhostTyperProps {
  text: string;
  isActive: boolean;
}

export const GhostTyper = ({ text, isActive }: GhostTyperProps) => {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      className="w-full px-4 sm:px-6 py-4 font-mono text-2xl md:text-4xl lg:text-5xl tracking-normal"
    >
      <div className="max-w-6xl mx-auto bg-black/50 backdrop-blur-sm rounded-lg border border-cyan-400/30 px-5 sm:px-8 py-5 sm:py-7" style={{ boxShadow: '0 0 25px rgba(34,211,238,0.15)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <div className="w-2 h-2 rounded-full bg-green-500/70" />
          <span className="text-[10px] sm:text-xs text-cyan-300/50 ml-2 font-mono">equitylabs://agent-core</span>
        </div>
        <div className="font-mono min-h-[2.8em] leading-tight text-cyan-300" style={{ textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>
          <span className="text-cyan-400/70 mr-2">{'>'}</span>
          <span>{displayed}</span>
          <span className={`inline-block w-[3px] h-[1em] bg-cyan-300 ml-[2px] align-middle transition-opacity ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>
    </motion.div>
  );
};
