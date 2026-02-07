import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
}

export const useSpeechRecognition = (lang: string = 'en-US') => {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    error: null,
    isSupported: false,
  });

  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const recognitionInstance = new (window as any).webkitSpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = lang;

      recognitionInstance.onstart = () => {
        setState(s => ({ ...s, isListening: true, error: null }));
      };

      recognitionInstance.onend = () => {
        setState(s => ({ ...s, isListening: false }));
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setState(s => ({ ...s, transcript }));
      };

      recognitionInstance.onerror = (event: any) => {
        setState(s => ({ ...s, error: event.error, isListening: false }));
      };

      setRecognition(recognitionInstance);
      setState(s => ({ ...s, isSupported: true }));
    }
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        // Handle "already started" errors
        console.error(e);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return { ...state, startListening, stopListening };
};
