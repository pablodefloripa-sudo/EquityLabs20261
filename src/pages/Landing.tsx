import { useState } from 'react';
import { Crown, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { getLandingLang, setStoredLandingLang } from '@/components/landing/landingContent';

const agentsBg = '/slides/base.jpg';
const LANDING_SCALE_MIN = 0.55;
const LANDING_SCALE_MAX = 2;
const LANDING_SCALE_STEP = 0.1;

const Landing = () => {
  const [lang, setLang] = useState<LandingLang>(() => getLandingLang());
  const [visualScale, setVisualScale] = useState(1);
  const navigate = useNavigate();

  const increaseZoom = () => {
    setVisualScale(value => Math.min(LANDING_SCALE_MAX, Number((value + LANDING_SCALE_STEP).toFixed(2))));
  };

  const decreaseZoom = () => {
    setVisualScale(value => Math.max(LANDING_SCALE_MIN, Number((value - LANDING_SCALE_STEP).toFixed(2))));
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

      <div className="fixed inset-x-4 top-4 z-[100] flex justify-end">
        <div className="flex max-w-full flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/suscripciones')}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-fuchsia-400/30 bg-black/55 px-4 py-2 text-sm text-fuchsia-100 backdrop-blur-xl transition hover:border-fuchsia-300 hover:bg-fuchsia-400/10"
          >
            <Crown className="h-4 w-4" />
            Ver suscripciones
          </button>

          <div className="flex items-center gap-1 rounded-full border border-cyan-300/25 bg-black/55 p-1 backdrop-blur-xl shadow-[0_0_18px_rgba(34,211,238,0.2)]">
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

          <LanguageFloater
            className="relative"
            lang={lang}
            onChange={(nextLang) => {
              setStoredLandingLang(nextLang);
              setLang(nextLang);
            }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <AgentEliteCarousel lang={lang} visualScale={visualScale} />
      </div>
    </div>
  );
};

export default Landing;
