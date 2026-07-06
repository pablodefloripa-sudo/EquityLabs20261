import { useState } from 'react';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import { IntroSequence } from '@/components/landing/IntroSequence';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';

const agentsBg = '/slides/base.jpg';

function detectLang(): LandingLang {
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  const supported: LandingLang[] = ['en', 'es', 'it', 'pt', 'fr', 'de', 'pl', 'nl'];
  return supported.includes(nav as LandingLang) ? (nav as LandingLang) : 'en';
}

const Landing = () => {
  const [lang, setLang] = useState<LandingLang>(detectLang);
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src={agentsBg}
          alt=""
          aria-hidden
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <LanguageFloater lang={lang} onChange={setLang} />

      {!introDone && (
        <IntroSequence lang={lang} onComplete={() => setIntroDone(true)} />
      )}

      {introDone && (
        <div className="relative z-10">
          <AgentEliteCarousel lang={lang} />
        </div>
      )}
    </div>
  );
};

export default Landing;
