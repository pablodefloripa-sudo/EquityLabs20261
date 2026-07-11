import { useState } from 'react';
import { Crown, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import { IntroVideo } from '@/components/landing/IntroVideo';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { getLandingLang, setStoredLandingLang } from '@/components/landing/landingContent';

const agentsBg = '/slides/base.jpg';
const introVideoSrc = '/intro.mp4';

const Landing = () => {
  const [lang, setLang] = useState<LandingLang>(() => getLandingLang());
  const [introDone, setIntroDone] = useState(false);
  const [visualScale, setVisualScale] = useState(1);
  const navigate = useNavigate();

  const increaseZoom = () => {
    setVisualScale(value => Math.min(1.25, Number((value + 0.08).toFixed(2))));
  };

  const decreaseZoom = () => {
    setVisualScale(value => Math.max(0.86, Number((value - 0.08).toFixed(2))));
  };

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

      <LanguageFloater
        lang={lang}
        onChange={(nextLang) => {
          setStoredLandingLang(nextLang);
          setLang(nextLang);
        }}
      />

      <div className="fixed top-4 right-20 z-50 flex items-center gap-1 rounded-full border border-cyan-300/25 bg-black/55 p-1 backdrop-blur-xl shadow-[0_0_18px_rgba(34,211,238,0.2)]">
        <button
          type="button"
          title="Agrandar visual"
          aria-label="Agrandar visual"
          onClick={increaseZoom}
          className="flex h-8 w-8 items-center justify-center rounded-full text-cyan-200/80 transition hover:bg-cyan-300/12 hover:text-cyan-50"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Achicar visual"
          aria-label="Achicar visual"
          onClick={decreaseZoom}
          className="flex h-8 w-8 items-center justify-center rounded-full text-cyan-200/80 transition hover:bg-cyan-300/12 hover:text-cyan-50"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/suscripciones')}
        className="fixed top-4 right-[15rem] z-50 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 py-2 text-sm text-fuchsia-100 backdrop-blur-xl transition hover:border-fuchsia-300 hover:bg-fuchsia-400/10"
      >
        <Crown className="h-4 w-4" />
        Ver suscripciones
      </button>

      {!introDone && <IntroVideo src={introVideoSrc} onEnded={() => setIntroDone(true)} />}

      {introDone && (
        <div
          className="relative z-10 origin-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${visualScale})` }}
        >
          <AgentEliteCarousel lang={lang} />
        </div>
      )}
    </div>
  );
};

export default Landing;
