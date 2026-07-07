import { useState } from 'react';
import type { CSSProperties } from 'react';
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
            className={`dashboard-neon-tab fixed z-30 flex items-center gap-3 py-6 px-3
                       border border-cyan-300/45 transition-all duration-300
                       group cursor-pointer shadow-[0_0_32px_rgba(34,211,238,0.28),0_0_14px_rgba(6,182,212,0.32)_inset]
                       hover:border-cyan-200/70 hover:shadow-[0_0_52px_rgba(34,211,238,0.42),0_0_22px_rgba(6,182,212,0.42)_inset]
                       ${isLeft ? 'left-0 rounded-r-xl' : 'right-0 rounded-l-xl'}`}
            style={{
              top: tabPosition || '50%',
              transform: tabPosition ? 'none' : 'translateY(-50%)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            <span className="text-primary/90 drop-shadow-[0_0_8px_rgba(34,211,238,0.75)] group-hover:text-primary transition-colors [&_svg]:h-5 [&_svg]:w-5">
              {icon}
            </span>
            <span className="text-sm font-display font-semibold tracking-wide text-cyan-100/82 group-hover:text-cyan-50 transition-colors">
              {title}
            </span>
            <span className="text-cyan-200/70 group-hover:text-primary transition-colors">
              {isLeft ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
              className={`dashboard-neon-surface fixed top-0 bottom-0 z-30 w-80 
                         border-cyan-400/20
                         ${isLeft ? 'left-0 border-r' : 'right-0 border-l'}`}
            >
              {/* Header */}
              <div className="relative flex items-center justify-between p-4 border-b border-cyan-400/15">
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
              <div
                className="dashboard-zoom-content p-4 overflow-y-auto h-[calc(100%-60px)] scrollbar-thin"
                style={{ zoom: 'var(--dashboard-content-scale)' } as CSSProperties}
              >
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
