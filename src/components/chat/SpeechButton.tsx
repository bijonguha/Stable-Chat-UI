import { useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';

export function SpeechButton({ text }: { text?: string }) {
  const { speak, stop, isSpeaking, isSupported } = useSpeechSynthesis();

  const handleClick = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else if (text) {
      speak(text);
    }
  }, [isSpeaking, text, speak, stop]);

  if (!isSupported || !text) return null;

  return (
    <button
      onClick={handleClick}
      className="text-dark-300 hover:text-purple-300 transition-colors cursor-pointer bg-transparent border-none p-0.5"
      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
    >
      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );
}
