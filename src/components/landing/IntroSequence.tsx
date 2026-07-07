import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LandingLang } from './LanguageFloater';
import { CursorTrail } from './CursorTrail';

interface Props {
  lang: LandingLang;
  onComplete: () => void;
  visualScale?: number;
}

const SLIDE_COUNT = 5;
const AUTO_MS = 5200;

const slideUrl = (_lang: LandingLang, idx: number) => {
  // Intro slides are English for now. Add language codes here when localized assets exist.
  const code = 'en';
  return `/slides/${code}/${code}-${idx + 1}.jpg`;
};

export const IntroSequence = ({ lang, onComplete, visualScale = 1 }: Props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      if (index < SLIDE_COUNT - 1) setIndex(index + 1);
      else onComplete();
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [index, onComplete]);

  const go = (dir: 1 | -1) => {
    const next = index + dir;
    if (next < 0) return;
    if (next >= SLIDE_COUNT) {
      onComplete();
      return;
    }
    setIndex(next);
  };

  return (
    <div className="fixed inset-0 z-20 bg-black cursor-none">
      <CursorTrail />

      <AnimatePresence mode="sync">
        <motion.img
          key={index}
          src={slideUrl(lang, index)}
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.src.includes('/en/')) img.src = `/slides/en/en-${index + 1}.jpg`;
          }}
          alt=""
          aria-hidden
          initial={{ opacity: 0, scale: visualScale + 0.02 }}
          animate={{ opacity: 1, scale: visualScale }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transformOrigin: 'center' }}
        />
      </AnimatePresence>

      <button
        onClick={onComplete}
        className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-full border border-cyan-500/40 bg-black/60 backdrop-blur-xl text-cyan-300 text-xs font-mono tracking-wide hover:border-cyan-400 transition-colors cursor-pointer"
      >
        SKIP -&gt;
      </button>

      <button
        onClick={() => go(-1)}
        disabled={index === 0}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-cyan-400/50 bg-black/40 backdrop-blur-xl text-cyan-300 hover:border-cyan-300 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.35)]"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full border border-cyan-400/50 bg-black/40 backdrop-blur-xl text-cyan-300 hover:border-cyan-300 hover:bg-black/70 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.35)]"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
              i === index ? 'w-10 bg-cyan-400' : 'w-4 bg-cyan-400/30 hover:bg-cyan-400/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
