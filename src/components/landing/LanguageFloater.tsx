import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { getLanguageName, type Language } from '@/hooks/useLanguage';

export type LandingLang = 'en' | 'es' | 'it' | 'pt' | 'fr' | 'de' | 'pl' | 'nl';

interface Props {
  lang: LandingLang;
  onChange: (l: LandingLang) => void;
}

const flags: Record<LandingLang, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇧🇷',
  fr: '🇫🇷',
  de: '🇩🇪',
  pl: '🇵🇱',
  nl: '🇳🇱',
};

const langToAppLanguage: Record<LandingLang, Language> = {
  en: 'EN',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  fr: 'FR',
  de: 'DE',
  pl: 'PL',
  nl: 'NL',
};

export const LanguageFloater = ({ lang, onChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-4 z-[100]">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-black/60 px-3 py-1.5 text-xs tracking-wide text-cyan-400 backdrop-blur-xl transition-colors hover:border-cyan-400"
      >
        <Globe className="h-4 w-4" />
        <span className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{flags[lang]}</span>
          <span className="font-medium">{getLanguageName(langToAppLanguage[lang])}</span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="absolute right-0 top-10 min-w-[180px] overflow-hidden rounded-lg border border-cyan-500/30 bg-black/90 shadow-xl backdrop-blur-xl"
            >
              {(Object.keys(flags) as LandingLang[])
                .filter((item) => item !== lang)
                .map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-cyan-500/10 hover:text-cyan-400"
                  >
                    <span className="text-sm leading-none">{flags[item]}</span>
                    <span className="font-medium">{getLanguageName(langToAppLanguage[item])}</span>
                  </button>
                ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
