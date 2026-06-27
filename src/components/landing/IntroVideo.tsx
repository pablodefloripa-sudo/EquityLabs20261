import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

interface Props {
  src: string;
  onEnded: (lastFrameDataUrl: string | null) => void;
}

/**
 * Plays the intro video full-screen. When it ends (or the user skips),
 * captures the last frame to a still image, unmounts the video element to
 * free the 4K decoder pipeline, and hands the still back to the parent so
 * it can be used as a lightweight background for the agents carousel.
 */
export const IntroVideo = ({ src, onEnded }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [hidden, setHidden] = useState(false);

  const captureLastFrame = (): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    try {
      // Downscale to viewport-ish resolution to keep the still cheap on mobile
      const maxW = Math.min(1920, v.videoWidth);
      const scale = maxW / v.videoWidth;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      return null;
    }
  };

  const finish = () => {
    const v = videoRef.current;
    let still: string | null = null;
    if (v) {
      try {
        v.pause();
        if (v.duration) v.currentTime = Math.max(0, v.duration - 0.05);
      } catch {}
      still = captureLastFrame();
      try {
        v.removeAttribute('src');
        v.load(); // releases decoder buffers
      } catch {}
    }
    setHidden(true);
    onEnded(still);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleEnd = () => finish();
    v.addEventListener('ended', handleEnd);

    // Try unmuted autoplay; gracefully fall back to muted if blocked.
    v.muted = false;
    v.play().then(() => setMuted(false)).catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
    return () => v.removeEventListener('ended', handleEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  if (hidden) return null;

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        playsInline
        autoPlay
        preload="auto"
        crossOrigin="anonymous"
        disablePictureInPicture
        disableRemotePlayback
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          // Promote to its own GPU layer; avoids re-paint of overlay siblings
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
        }}
      />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-6 right-6 z-50 flex gap-2"
        >
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-black/60 border border-cyan-400/40 text-cyan-300 flex items-center justify-center hover:border-cyan-300 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={finish}
            className="px-4 h-10 rounded-full bg-black/60 border border-cyan-400/40 text-cyan-300 text-xs font-mono tracking-wider flex items-center gap-2 hover:border-cyan-300 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            SKIP
          </button>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
