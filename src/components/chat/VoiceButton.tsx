import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onAutoSend: () => void;
  disabled?: boolean;
}

export function VoiceButton({ onTranscript, onAutoSend, disabled }: VoiceButtonProps) {
  const { isRecording, isSupported, startListening, stopListening, error } = useVoiceInput({
    onResult: (result) => {
      const text = result.finalTranscript || result.interimTranscript;
      if (text) onTranscript(text);
      if (result.finalTranscript && shouldAutoSend(result.finalTranscript)) {
        setTimeout(() => onAutoSend(), 500);
      }
    },
  });

  if (!isSupported) return null;

  const handleClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border-none cursor-pointer transition-all ${
          isRecording
            ? 'bg-gradient-to-br from-red-600 to-red-700 animate-pulse-scale'
            : 'bg-gradient-to-br from-green-500 to-green-600 hover:-translate-y-px'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Stop recording' : 'Voice input'}
      >
        {isRecording ? (
          <MicOff className="w-4 h-4 text-white" />
        ) : (
          <Mic className="w-4 h-4 text-white" />
        )}
      </button>

      {isRecording && (
        <div className="mt-2 px-3 py-2 bg-dark-700/80 border border-green-300/30 rounded-lg text-green-300 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-blink" />
            <span className="font-medium">Listening...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 px-3 py-2 bg-dark-700/80 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}

function shouldAutoSend(transcript: string): boolean {
  const trimmed = transcript.trim();
  return /[.!?]$/.test(trimmed) && trimmed.length > 3;
}
