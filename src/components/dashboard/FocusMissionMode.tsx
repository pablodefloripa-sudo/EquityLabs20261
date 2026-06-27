import { motion, AnimatePresence } from 'framer-motion';
import { GlassCockpit } from './GlassCockpit';
import { FocusNavigation } from './FocusNavigation';

interface FocusMissionModeProps {
  isActive: boolean;
  onExit: () => void;
  onSettings: () => void;
}

export const FocusMissionMode = ({ isActive, onExit, onSettings }: FocusMissionModeProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop - transparent to show blurred dashboard behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
            onClick={onExit}
          />

          {/* Glass Cockpit */}
          <GlassCockpit onClose={onExit} />

          {/* Fixed Navigation */}
          <FocusNavigation onExit={onExit} onSettings={onSettings} />
        </>
      )}
    </AnimatePresence>
  );
};
