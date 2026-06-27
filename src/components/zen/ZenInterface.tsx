import { useState, useCallback } from 'react';
import { ZenBackground } from './ZenBackground';
import { CommandCenter } from './CommandCenter';
import { AgentOrchestrator } from './AgentOrchestrator';
import { QuickMenu } from './QuickMenu';
import { ZenFooter } from './ZenFooter';
import { motion, AnimatePresence } from 'framer-motion';

export const ZenInterface = () => {
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCommand = useCallback((command: string) => {
    setCurrentCommand(command);
    setIsProcessing(true);
  }, []);

  const handleComplete = useCallback(() => {
    setCurrentCommand(null);
    setIsProcessing(false);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Background */}
      <ZenBackground />

      {/* Quick Menu */}
      <QuickMenu />

      {/* Main content area */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pb-12">
        {/* Logo/Title - only visible when not processing */}
        <AnimatePresence>
          {!isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-12 text-center"
            >
              <h1 className="text-3xl font-display font-light tracking-tight text-foreground/90">
                <span className="text-primary font-medium">EQuity</span>Labs
              </h1>
              <p className="text-sm text-muted-foreground/50 mt-2 font-display">
                Interfaz Zen de Comando
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Orchestrator - shown when processing */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <AgentOrchestrator 
                command={currentCommand} 
                onComplete={handleComplete} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Command Center */}
        <div className={isProcessing ? 'mt-auto' : ''}>
          <CommandCenter 
            onCommand={handleCommand} 
            isProcessing={isProcessing} 
          />
        </div>
      </main>

      {/* Footer */}
      <ZenFooter />
    </div>
  );
};
