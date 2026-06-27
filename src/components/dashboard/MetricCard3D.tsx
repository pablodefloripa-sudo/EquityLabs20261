import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCard3DProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'accent';
}

const colorClasses = {
  primary: {
    text: 'text-primary',
    border: 'border-primary/30',
    glow: 'hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]',
    gradient: 'from-primary/20 to-transparent',
  },
  secondary: {
    text: 'text-secondary',
    border: 'border-secondary/30',
    glow: 'hover:shadow-[0_0_30px_hsl(var(--secondary)/0.3)]',
    gradient: 'from-secondary/20 to-transparent',
  },
  success: {
    text: 'text-success',
    border: 'border-success/30',
    glow: 'hover:shadow-[0_0_30px_hsl(var(--success)/0.3)]',
    gradient: 'from-success/20 to-transparent',
  },
  warning: {
    text: 'text-warning',
    border: 'border-warning/30',
    glow: 'hover:shadow-[0_0_30px_hsl(var(--warning)/0.3)]',
    gradient: 'from-warning/20 to-transparent',
  },
  accent: {
    text: 'text-accent',
    border: 'border-accent/30',
    glow: 'hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)]',
    gradient: 'from-accent/20 to-transparent',
  },
};

export const MetricCard3D = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
}: MetricCard3DProps) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -15 }}
      animate={{ opacity: 1, rotateX: 0 }}
      whileHover={{ 
        rotateX: 5, 
        rotateY: 5, 
        scale: 1.02,
        z: 50
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      className={`
        relative p-5 rounded-xl 
        bg-card/60 backdrop-blur-xl
        border ${colors.border}
        ${colors.glow}
        transition-shadow duration-300
        cursor-pointer
        perspective-container
      `}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className={`absolute left-0 right-0 h-12 bg-gradient-to-b ${colors.gradient}`}
          animate={{ y: ['-100%', '400%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Corner accent */}
      <div className={`absolute top-0 left-0 w-8 h-px bg-gradient-to-r ${colors.gradient}`} />
      <div className={`absolute top-0 left-0 w-px h-8 bg-gradient-to-b ${colors.gradient}`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-display text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-2 rounded-lg bg-${color}/10 ${colors.text}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-mono font-bold ${colors.text}`}>
            {value}
          </span>
          {unit && (
            <span className="text-sm font-mono text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        {/* Trend */}
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1">
            <span className={`text-xs font-mono ${
              trend === 'up' ? 'text-success' : 
              trend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          </div>
        )}
      </div>

      {/* Bottom glow line */}
      <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-${color}/50 to-transparent`} />
    </motion.div>
  );
};
