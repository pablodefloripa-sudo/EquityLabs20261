import { motion } from 'framer-motion';

const lines = [
  {
    top: '8%',
    left: '14%',
    width: '32%',
    height: '2px',
    rotate: -10,
    gradient: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.92) 22%, rgba(168,85,247,0.82) 55%, transparent 100%)',
    shadow: '0 0 18px rgba(34,211,238,0.55), 0 0 32px rgba(168,85,247,0.28)',
    x: 18,
    y: 10,
    duration: 14,
  },
  {
    top: '18%',
    right: '11%',
    width: '1px',
    height: '30%',
    rotate: 0,
    gradient: 'linear-gradient(180deg, transparent 0%, rgba(45,212,191,0.92) 20%, rgba(59,130,246,0.7) 65%, transparent 100%)',
    shadow: '0 0 18px rgba(45,212,191,0.5), 0 0 28px rgba(59,130,246,0.22)',
    x: -14,
    y: 18,
    duration: 18,
  },
  {
    bottom: '20%',
    left: '6%',
    width: '26%',
    height: '2px',
    rotate: 16,
    gradient: 'linear-gradient(90deg, transparent 0%, rgba(250,204,21,0.85) 28%, rgba(244,114,182,0.8) 66%, transparent 100%)',
    shadow: '0 0 16px rgba(250,204,21,0.35), 0 0 30px rgba(244,114,182,0.25)',
    x: 12,
    y: -12,
    duration: 16,
  },
  {
    top: '42%',
    right: '24%',
    width: '22%',
    height: '1px',
    rotate: -26,
    gradient: 'linear-gradient(90deg, transparent 0%, rgba(244,114,182,0.92) 35%, rgba(34,211,238,0.82) 70%, transparent 100%)',
    shadow: '0 0 15px rgba(244,114,182,0.42), 0 0 26px rgba(34,211,238,0.22)',
    x: -16,
    y: 8,
    duration: 13,
  },
  {
    bottom: '12%',
    right: '8%',
    width: '1px',
    height: '24%',
    rotate: 8,
    gradient: 'linear-gradient(180deg, transparent 0%, rgba(34,197,94,0.9) 20%, rgba(34,211,238,0.7) 70%, transparent 100%)',
    shadow: '0 0 14px rgba(34,197,94,0.32), 0 0 24px rgba(34,211,238,0.25)',
    x: 10,
    y: -14,
    duration: 17,
  },
  {
    top: '72%',
    left: '34%',
    width: '18%',
    height: '1px',
    rotate: -8,
    gradient: 'linear-gradient(90deg, transparent 0%, rgba(192,132,252,0.92) 30%, rgba(34,211,238,0.75) 70%, transparent 100%)',
    shadow: '0 0 15px rgba(192,132,252,0.38), 0 0 24px rgba(34,211,238,0.22)',
    x: 14,
    y: 6,
    duration: 12,
  },
];

export const DashboardNeonAtmosphere = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(168,85,247,0.11),transparent_24%),radial-gradient(circle_at_76%_78%,rgba(244,114,182,0.08),transparent_20%),radial-gradient(circle_at_18%_82%,rgba(34,197,94,0.07),transparent_18%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="absolute inset-y-0 left-[18%] w-px bg-gradient-to-b from-transparent via-cyan-300/35 to-transparent blur-[1px]" />
      <div className="absolute inset-y-0 right-[22%] w-px bg-gradient-to-b from-transparent via-fuchsia-300/30 to-transparent blur-[1px]" />

      {lines.map((line, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            top: line.top,
            right: line.right,
            bottom: line.bottom,
            left: line.left,
            width: line.width,
            height: line.height,
            rotate: `${line.rotate}deg`,
            background: line.gradient,
            boxShadow: line.shadow,
          }}
          animate={{
            x: [0, line.x, 0],
            y: [0, line.y, 0],
            opacity: [0.35, 0.92, 0.35],
          }}
          transition={{
            duration: line.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
