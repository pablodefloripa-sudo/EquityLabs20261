import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentEliteCarousel } from '@/components/landing/AgentEliteCarousel';
import { LanguageFloater, type LandingLang } from '@/components/landing/LanguageFloater';
import { IntroVideo } from '@/components/landing/IntroVideo';
import { IntroSequence } from '@/components/landing/IntroSequence';
const agentsBg = '/slides/base.jpg';

function detectLang(): LandingLang {
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  const supported: LandingLang[] = ['en', 'es', 'it', 'pt', 'fr', 'de', 'pl', 'nl'];
  return supported.includes(nav as LandingLang) ? (nav as LandingLang) : 'en';
}

const Landing = () => {
  const [lang, setLang] = useState<LandingLang>(detectLang);
  const [videoEnded, setVideoEnded] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [stillFrame, setStillFrame] = useState<string | null>(null);

  const handleVideoEnded = useCallback((still: string | null) => {
    setStillFrame(still);
    setVideoEnded(true);
  }, []);

  const bgImage = agentsBg;

  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const carouselAudioRef = useRef<HTMLAudioElement | null>(null);

  // Try to play whichever loop matches the current phase. Browsers may block
  // autoplay until the user interacts; we retry on the first pointer/key event.
  useEffect(() => {
    const intro = introAudioRef.current;
    const carousel = carouselAudioRef.current;
    if (!intro || !carousel) return;

    const fadeTo = (el: HTMLAudioElement, target: number, ms = 600) => {
      const start = el.volume;
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        el.volume = Math.max(0, Math.min(1, start + (target - start) * k));
        if (k < 1) requestAnimationFrame(step);
        else if (target === 0) el.pause();
      };
      requestAnimationFrame(step);
    };

    const playPhase = () => {
      if (!introDone) {
        carousel.pause();
        intro.volume = 0;
        intro.play().then(() => fadeTo(intro, 0.45)).catch(() => {});
      } else {
        fadeTo(intro, 0);
        carousel.volume = 0;
        carousel.play().then(() => fadeTo(carousel, 0.5)).catch(() => {});
      }
    };

    playPhase();

    const onInteract = () => playPhase();
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, [introDone, videoEnded]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <audio ref={introAudioRef} src="/audio/intro-loop.wav" loop preload="auto" />
      <audio ref={carouselAudioRef} src="/audio/carousel-loop.wav" loop preload="auto" />
      {/* Background layer — video while playing, still image afterwards */}
      <div className="fixed inset-0 z-0">
        {!videoEnded && <IntroVideo src="/intro.mp4" onEnded={handleVideoEnded} />}
        {videoEnded && (
          <>
            <img
              src={bgImage}
              alt=""
              aria-hidden
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
          </>
        )}
      </div>

      {/* Language selector always available after the video */}
      {videoEnded && <LanguageFloater lang={lang} onChange={setLang} />}

      {/* 3-slide intro sequence after the video, before the carousel */}
      {videoEnded && !introDone && (
        <IntroSequence lang={lang} onComplete={() => setIntroDone(true)} />
      )}

      {/* Carousel fades in once the intro sequence completes */}
      <AnimatePresence>
        {videoEnded && introDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0 }}
            className="relative z-10"
          >
            <AgentEliteCarousel lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
