import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export const FloatingIntercom = () => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass-card rounded-2xl border border-primary/20 px-6 py-3 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-display text-muted-foreground">
          Click para activar Focus Mode
        </span>
        <MessageSquare className="w-4 h-4 text-primary" />
      </motion.button>
    </motion.div>
  );
};
