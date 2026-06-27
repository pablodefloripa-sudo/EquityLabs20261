import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, BarChart3, CheckSquare, Grid3X3, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: BarChart3, label: 'Métricas', color: 'text-cyan-400' },
  { icon: CheckSquare, label: 'Tareas', color: 'text-emerald-400' },
  { icon: Grid3X3, label: 'Apps', color: 'text-pink-400' },
  { icon: Settings, label: 'Ajustes', color: 'text-amber-400' },
];

export const QuickMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (label: string) => {
    toast.info(`${label} - Próximamente`, {
      description: 'Esta función estará disponible pronto.',
      duration: 2000,
    });
    setIsOpen(false);
  };

  return (
    <div className="fixed top-6 left-6 z-50">
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-3 rounded-xl transition-all duration-300",
          "bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50",
          "hover:border-primary/30 hover:shadow-[0_0_20px_hsl(180,100%,50%,0.1)]",
          isOpen && "border-primary/30 bg-primary/10"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Menu items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 flex flex-col gap-2"
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemClick(item.label)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl",
                  "bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50",
                  "hover:border-zinc-700/50 transition-all duration-300",
                  "group"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-colors", item.color)} />
                <span className="text-sm font-display text-foreground/80 group-hover:text-foreground whitespace-nowrap">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
