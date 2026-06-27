import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  side: 'left' | 'right';
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  tabPosition?: string;
}

export const CollapsibleSidebar = ({
  children,
  side,
  title,
  icon,
  defaultOpen = false,
  tabPosition,
}: CollapsibleSidebarProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isLeft = side === 'left';

  return (
    <>
      {/* Collapsed Tab */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLeft ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className={`fixed z-30 flex items-center gap-2 py-4 px-2 
                       bg-card/80 backdrop-blur-xl border border-border/30 
                       hover:bg-card hover:border-primary/30 transition-all duration-300
                       group cursor-pointer
                       ${isLeft ? 'left-0 rounded-r-xl' : 'right-0 rounded-l-xl'}`}
            style={{
              top: tabPosition || '50%',
              transform: tabPosition ? 'none' : 'translateY(-50%)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            <span className="text-primary/70 group-hover:text-primary transition-colors">
              {icon}
            </span>
            <span className="text-xs font-display text-muted-foreground/70 group-hover:text-foreground/80 transition-colors">
              {title}
            </span>
            <span className="text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
              {isLeft ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-20"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: isLeft ? -320 : 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isLeft ? -320 : 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 bottom-0 z-30 w-80 
                         bg-card/95 backdrop-blur-xl border-border/30
                         ${isLeft ? 'left-0 border-r' : 'right-0 border-l'}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <span className="text-primary">{icon}</span>
                  <h3 className="font-display font-medium text-foreground/90">{title}</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLeft ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto h-[calc(100%-60px)] scrollbar-thin">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
