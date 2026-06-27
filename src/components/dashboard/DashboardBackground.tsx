import { motion } from 'framer-motion';
import { useMemo } from 'react';

export const DashboardBackground = () => {
  // Pre-generate star positions for stable rendering
  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.7,
      })),
    []
  );

  const brightStars = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 6,
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#01020a]">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, hsl(225 60% 8%) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, hsl(260 50% 6%) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, hsl(220 50% 4%) 0%, #01020a 80%)',
        }}
      />

      {/* Nebula clouds */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full blur-3xl opacity-30"
        style={{
          background:
            'radial-gradient(circle, hsl(220 100% 50% / 0.25) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(circle, hsl(280 100% 55% / 0.22) 0%, transparent 70%)',
        }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Twinkling stars */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.6)`,
          }}
          animate={{ opacity: [s.opacity * 0.2, s.opacity, s.opacity * 0.2] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Bright twinkling stars with glow */}
      {brightStars.map((s, i) => (
        <motion.div
          key={`bright-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: '2.5px',
            height: '2.5px',
            boxShadow:
              '0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(180,220,255,0.6)',
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
          transition={{
            duration: 3,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Comet 1 — diagonal sweep */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ top: '15%', left: '-10%' }}
        animate={{ x: ['0vw', '120vw'], y: ['0vh', '60vh'], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 6,
          delay: 4,
          repeat: Infinity,
          repeatDelay: 14,
          ease: 'easeOut',
          times: [0, 0.1, 0.85, 1],
        }}
      >
        <div className="relative">
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 h-[2px] w-40"
            style={{
              background:
                'linear-gradient(to left, rgba(255,255,255,0.95), rgba(180,220,255,0.4), transparent)',
              filter: 'blur(0.5px)',
            }}
          />
          <div
            className="w-2 h-2 rounded-full bg-white"
            style={{ boxShadow: '0 0 12px rgba(255,255,255,0.95), 0 0 24px rgba(180,220,255,0.7)' }}
          />
        </div>
      </motion.div>

      {/* Comet 2 — slower, opposite direction */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ top: '70%', left: '110%' }}
        animate={{ x: ['0vw', '-130vw'], y: ['0vh', '-40vh'], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 8,
          delay: 12,
          repeat: Infinity,
          repeatDelay: 20,
          ease: 'easeOut',
          times: [0, 0.1, 0.85, 1],
        }}
      >
        <div className="relative">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] w-32"
            style={{
              background:
                'linear-gradient(to right, rgba(255,255,255,0.85), rgba(200,230,255,0.35), transparent)',
              filter: 'blur(0.5px)',
            }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-white"
            style={{ boxShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(200,230,255,0.6)' }}
          />
        </div>
      </motion.div>

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
    </div>
  );
};
