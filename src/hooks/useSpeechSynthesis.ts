import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current!.getVoices();
      // Select best English voice
      const priorities = [
        (v: SpeechSynthesisVoice) => v.lang === 'en-US' && v.name.includes('Neural'),
        (v: SpeechSynthesisVoice) => v.lang === 'en-US' && v.name.includes('Enhanced'),
        (v: SpeechSynthesisVoice) => v.lang === 'en-US' && v.default,
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-') && v.default,
        (v: SpeechSynthesisVoice) => v.lang === 'en-US',
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en-'),
      ];
      for (const p of priorities) {
        const voice = voices.find(p);
        if (voice) { voiceRef.current = voice; break; }
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isSupported]);

  const cleanText = useCallback((text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, 'code block')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim() || !synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText(text));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [isSupported, cleanText]);

  const stop = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}
