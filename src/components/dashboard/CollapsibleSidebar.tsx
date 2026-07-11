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
  widthClassName?: string;
}

export const CollapsibleSidebar = ({
  children,
  side,
  title,
  icon,
  defaultOpen = false,
  tabPosition,
  widthClassName = 'w-80',
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
            
            {/* Panel con altura ajustada y posición alineada */}
            <motion.div
              initial={{ x: isLeft ? -320 : 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isLeft ? -320 : 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`dashboard-neon-surface fixed top-24 bottom-auto z-30 ${widthClassName}
                         shadow-2xl
                         ${isLeft ? 'left-0 rounded-l-none' : 'right-0 rounded-r-none'}`}
              style={{
                height: 'calc(100vh - 320px)',
                maxHeight: '60vh',
                minHeight: '280px',
                borderRadius: '16px',
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0.95)), linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                animation: 'borderGlow 4s ease-in-out infinite',
              }}
            >
              {/* Borde animado overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  padding: '2px',
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4)',
                  backgroundSize: '300% 300%',
                  animation: 'gradientMove 6s ease-in-out infinite',
                  borderRadius: '16px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />

              {/* Header */}
              <div className="relative flex items-center justify-between p-4 border-b border-cyan-400/15 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-primary/90">{icon}</span>
                  <h3 className="font-display font-medium text-foreground/90 text-sm tracking-wide uppercase">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLeft ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Content */}
              <div
                className="p-5 overflow-y-auto h-[calc(100%-60px)] scrollbar-thin space-y-4 relative z-10"
                style={{ zoom: 'var(--dashboard-content-scale)' } as CSSProperties}
              >
                <div className="text-sm leading-relaxed text-slate-300/90 [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:text-slate-400 [&_h4]:mb-1 [&_p]:text-slate-300/80 [&_p]:leading-relaxed [&_button]:text-sm [&_button]:font-medium [&_button]:text-cyan-300 hover:[&_button]:text-cyan-100 [&_button]:transition-colors">
                  {children}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Estilos de animación globales */}
      <style>{`
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(6, 182, 212, 0.3); }
          25% { border-color: rgba(139, 92, 246, 0.5); }
          50% { border-color: rgba(236, 72, 153, 0.5); }
          75% { border-color: rgba(245, 158, 11, 0.4); }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .dashboard-neon-surface {
          position: relative;
          border-radius: 16px;
        }
        .dashboard-neon-surface::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 18px;
          padding: 2px;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4);
          background-size: 300% 300%;
          animation: gradientMove 4s ease-in-out infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 0;
        }
        .dashboard-neon-surface > * {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </>
  );
};
