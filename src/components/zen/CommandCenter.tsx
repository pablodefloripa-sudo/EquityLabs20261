import { useState, KeyboardEvent } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { cn } from '@/lib/utils';

interface CommandCenterProps {
  onCommand: (command: string) => void;
  isProcessing: boolean;
}

export const CommandCenter = ({ onCommand, isProcessing }: CommandCenterProps) => {
  const [inputValue, setInputValue] = useState('');
  const { isListening, transcript, isSupported, toggleListening } = useVoiceCommands({
    onCommand: (command) => {
      if (command && !isProcessing) {
        onCommand(command);
      }
    },
  });

  const handleSubmit = () => {
    if (inputValue.trim() && !isProcessing) {
      onCommand(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isProcessing ? 0.3 : 1, 
        y: 0,
        scale: isProcessing ? 0.95 : 1,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Main input container */}
      <div className="relative group">
        <div className={cn(
          "flex items-center gap-3 px-6 py-4 rounded-2xl",
          "bg-zinc-900/60 backdrop-blur-xl",
          "border border-zinc-800/50",
          "transition-all duration-300",
          "focus-within:border-primary/30 focus-within:shadow-[0_0_30px_hsl(180,100%,50%,0.1)]",
          "group-hover:border-zinc-700/50"
        )}>
          {/* Text input */}
          <input
            type="text"
            value={isListening ? transcript : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando..."
            disabled={isProcessing || isListening}
            className={cn(
              "flex-1 bg-transparent outline-none",
              "text-foreground placeholder:text-muted-foreground/50",
              "font-display text-lg",
              "disabled:opacity-50"
            )}
          />

          {/* Voice button */}
          {isSupported && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing}
              className={cn(
                "p-3 rounded-xl transition-all duration-300",
                isListening 
                  ? "bg-primary/20 text-primary shadow-[0_0_20px_hsl(180,100%,50%,0.3)]" 
                  : "bg-zinc-800/50 text-muted-foreground hover:text-foreground hover:bg-zinc-800"
              )}
            >
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic className="w-5 h-5" />
                </motion.div>
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </motion.button>
          )}

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isProcessing || (!inputValue.trim() && !isListening)}
            className={cn(
              "p-3 rounded-xl transition-all duration-300",
              inputValue.trim() 
                ? "bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-[0_0_20px_hsl(180,100%,50%,0.2)]" 
                : "bg-zinc-800/50 text-muted-foreground/30"
            )}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Listening indicator */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Escuchando...
          </motion.div>
        )}
      </div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.3 }}
        className="text-center text-muted-foreground/40 text-sm mt-4 font-display"
      >
        Presiona Enter para enviar o usa el micrófono
      </motion.p>
    </motion.div>
  );
};
