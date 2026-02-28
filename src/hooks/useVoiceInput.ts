import { useState, useCallback, useRef, useEffect } from 'react';
import type { VoiceResult } from '../types/voice';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface UseVoiceInputOptions {
  onResult?: (result: VoiceResult) => void;
  language?: string;
}

export function useVoiceInput({ onResult, language = 'en-US' }: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      onResult?.({
        finalTranscript: finalTranscript.trim(),
        interimTranscript: interimTranscript.trim(),
        isFinal: finalTranscript.length > 0,
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Audio capture failed. Check microphone permissions.',
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'network': 'Network error. Please check your connection.',
      };
      setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [isSupported, language, onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isRecording) return;
    setError(null);
    try {
      recognitionRef.current.start();
    } catch {
      setError('Failed to start voice recognition.');
    }
  }, [isRecording]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;
    try {
      recognitionRef.current.stop();
    } catch {}
  }, [isRecording]);

  return { isRecording, isSupported, error, startListening, stopListening };
}
