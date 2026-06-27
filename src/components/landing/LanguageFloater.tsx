import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';

export type LandingLang = 'en' | 'es' | 'it' | 'pt' | 'fr' | 'de' | 'pl' | 'nl';

const langLabels: Record<LandingLang, string> = {
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  pl: 'Polski',
  nl: 'Nederlands',
};

interface Props {
  lang: LandingLang;
  onChange: (l: LandingLang) => void;
}

const flags: Record<LandingLang, string> = {
  en: '🇺🇸', es: '🇪🇸', it: '🇮🇹', pt: '🇧🇷', fr: '🇫🇷', de: '🇩🇪', pl: '🇵🇱', nl: '🇳🇱',
};

export const LanguageFloater = ({ lang, onChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/40 bg-black/60 backdrop-blur-xl text-cyan-400 text-xs font-mono tracking-wide hover:border-cyan-400 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{lang.toUpperCase()}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="absolute right-0 top-10 bg-black/90 backdrop-blur-xl rounded-lg border border-cyan-500/30 overflow-hidden min-w-[120px] shadow-xl"
            >
              {(Object.keys(flags) as LandingLang[]).filter(l => l !== lang).map((l) => (
                <button
                  key={l}
                  onClick={() => { onChange(l); setOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-400"
                >
                  <span className="text-base leading-none">{flags[l]}</span>
                  <span className="font-mono">{l.toUpperCase()}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
