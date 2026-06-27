import { motion } from 'framer-motion';
import { Globe, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusNavigationProps {
  onExit: () => void;
  onSettings: () => void;
}

export const FocusNavigation = ({ onExit, onSettings }: FocusNavigationProps) => {
  const buttonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.1, z: 20 },
    tap: { scale: 0.95 },
  };

  const glassButtonClass = `
    w-12 h-12 rounded-full 
    bg-background/40 backdrop-blur-md 
    border border-white/10 
    text-muted-foreground 
    hover:text-foreground hover:bg-background/60 
    hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]
    transition-all duration-300
  `;

  return (
    <>
      {/* Top Left - Language Selector */}
      <motion.div
        className="fixed top-6 left-6 z-[60]"
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.1 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={glassButtonClass}
          title="Language / Idioma"
        >
          <Globe className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Top Right - Settings */}
      <motion.div
        className="fixed top-6 right-6 z-[60]"
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.15 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={glassButtonClass}
          onClick={onSettings}
          title="Ajustes"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Bottom Right - Exit Focus Mode */}
      <motion.div
        className="fixed bottom-6 right-6 z-[60]"
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={{ delay: 0.2 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`${glassButtonClass} hover:text-destructive hover:border-destructive/30 hover:shadow-[0_0_20px_hsl(0_84%_60%/0.3)]`}
          onClick={onExit}
          title="Salir del Modo Focus"
        >
          <X className="w-5 h-5" />
        </Button>
      </motion.div>
    </>
  );
};
