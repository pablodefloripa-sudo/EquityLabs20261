import { motion } from 'framer-motion';
import { Bot, Sparkles, Cpu, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentType = 'master' | 'specialist';

interface AgentWindowProps {
  type: AgentType;
  message: string;
  isVisible: boolean;
  position?: 'center' | 'shifted';
  specialistColor?: 'pink' | 'green';
}

const agentConfig = {
  master: {
    name: 'Agente Maestro',
    icon: Bot,
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_40px_hsl(180,100%,50%,0.2)]',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  specialist: {
    name: 'Agente Especialista',
    icon: Cpu,
    color: 'pink',
    gradient: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    glow: 'shadow-[0_0_40px_hsl(330,80%,60%,0.2)]',
    textColor: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
};

const specialistColors = {
  pink: {
    gradient: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    glow: 'shadow-[0_0_40px_hsl(330,80%,60%,0.2)]',
    textColor: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
  green: {
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_40px_hsl(145,80%,50%,0.2)]',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
};

export const AgentWindow = ({ 
  type, 
  message, 
  isVisible, 
  position = 'center',
  specialistColor = 'pink' 
}: AgentWindowProps) => {
  const baseConfig = agentConfig[type];
  const colorConfig = type === 'specialist' ? specialistColors[specialistColor] : baseConfig;
  const Icon = baseConfig.icon;

  const variants = {
    hidden: {
      opacity: 0,
      z: -200,
      scale: 0.8,
      rotateX: 15,
      y: 0,
    },
    visible: {
      opacity: 1,
      z: 0,
      scale: 1,
      rotateX: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 120,
        duration: 0.6,
      },
    },
    shifted: {
      opacity: 0.4,
      z: -100,
      scale: 0.85,
      rotateX: 5,
      y: -150,
      x: -100,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 100,
      },
    },
    exit: {
      opacity: 0,
      z: -150,
      scale: 0.9,
      y: -50,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate={position === 'shifted' ? 'shifted' : isVisible ? 'visible' : 'hidden'}
      exit="exit"
      variants={variants}
      style={{ transformStyle: 'preserve-3d' }}
      className={cn(
        "w-full max-w-lg p-6 rounded-2xl",
        "backdrop-blur-xl",
        "border",
        colorConfig.border,
        colorConfig.glow,
        `bg-gradient-to-br ${colorConfig.gradient}`,
        "bg-zinc-900/80"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-xl",
          colorConfig.bgColor
        )}>
          <Icon className={cn("w-5 h-5", colorConfig.textColor)} />
        </div>
        <div>
          <h3 className={cn("font-display font-semibold", colorConfig.textColor)}>
            {baseConfig.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              type === 'master' ? 'bg-cyan-400' : specialistColor === 'pink' ? 'bg-pink-400' : 'bg-emerald-400'
            )} />
            {type === 'master' ? 'Procesando...' : 'Respuesta lista'}
          </div>
        </div>
      </div>

      {/* Message content */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className={cn("w-4 h-4 mt-1 flex-shrink-0", colorConfig.textColor)} />
          <p className="text-foreground/90 font-display leading-relaxed">
            {message}
          </p>
        </div>

        {type === 'specialist' && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Análisis completado</span>
          </div>
        )}
      </div>

      {/* Processing indicator for master */}
      {type === 'master' && (
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn("w-2 h-2 rounded-full", colorConfig.bgColor)}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
