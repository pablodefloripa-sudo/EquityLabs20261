import { useState, useCallback, useRef, useEffect } from 'react';

interface UseKokoroTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  isReady: boolean;
  error: string | null;
}

// Using Web Speech API as a fallback since kokoro-js requires specific ONNX setup
// This provides immediate TTS functionality while we can add kokoro-js later
export const useKokoroTTS = (): UseKokoroTTSReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const checkSupport = () => {
      if ('speechSynthesis' in window) {
        // Wait for voices to load
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            setIsReady(true);
            setIsLoading(false);
          }
        };

        // Some browsers load voices asynchronously
        if (window.speechSynthesis.getVoices().length > 0) {
          setIsReady(true);
          setIsLoading(false);
        } else {
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
          // Fallback timeout
          setTimeout(() => {
            setIsReady(true);
            setIsLoading(false);
          }, 1000);
        }
      } else {
        setError('Speech synthesis no soportado en este navegador');
        setIsLoading(false);
      }
    };

    checkSupport();
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!isReady) {
      console.warn('TTS not ready yet');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Try to find a Spanish voice
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(
        voice => voice.lang.startsWith('es') && voice.name.includes('Google')
      ) || voices.find(
        voice => voice.lang.startsWith('es')
      );

      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        if (event.error !== 'canceled') {
          console.error('TTS Error:', event.error);
          reject(new Error(event.error));
        } else {
          resolve();
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isReady]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isLoading,
    isSpeaking,
    isReady,
    error,
  };
};
