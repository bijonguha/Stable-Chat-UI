import { ComposerPrimitive } from '@assistant-ui/react';
import { Send } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { useRef } from 'react';

export function CustomComposer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceTranscript = (text: string) => {
    // Voice transcript is set via the native input - we dispatch an input event
    if (inputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(inputRef.current, text);
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <div className="p-4 border-t border-dark-400/20">
      <ComposerPrimitive.Root className="flex gap-2 items-center">
        <ComposerPrimitive.Input
          ref={inputRef}
          placeholder="Type your message or use voice..."
          rows={1}
          className="flex-1 glass-input rounded-xl px-4 py-3 text-dark-50 text-sm resize-none min-h-[44px] max-h-[120px] leading-5 font-[inherit] placeholder:text-dark-300"
          autoFocus
        />
        <VoiceButton
          onTranscript={handleVoiceTranscript}
          onAutoSend={() => {
            // Trigger submit programmatically
            const form = inputRef.current?.closest('form');
            if (form) form.requestSubmit();
          }}
        />
        <ComposerPrimitive.Send className="btn-gradient-purple border-none rounded-xl px-5 py-3 text-white text-sm font-medium cursor-pointer transition-all h-11 flex items-center justify-center flex-shrink-0 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="w-4 h-4" />
        </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </div>
  );
}
