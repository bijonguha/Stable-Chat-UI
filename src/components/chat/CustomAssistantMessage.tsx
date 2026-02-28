import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { formatTimestamp } from '../../utils/formatters';
import { SpeechButton } from './SpeechButton';
import { useMemo } from 'react';

export function CustomAssistantMessage() {
  const message = useMessage();
  const fullText = useMemo(() => {
    if (!message?.content) return '';
    return message.content
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('\n');
  }, [message?.content]);

  return (
    <MessagePrimitive.Root className="flex flex-col max-w-[80%] self-start">
      <div className="bubble-assistant text-dark-50 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
        <MessagePrimitive.Content
          components={{
            Text: ({ part }) => (
              <div className="[&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-dark-400/30 [&_pre]:rounded-lg [&_pre]:p-4 [&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-amber-400 [&_code]:text-[0.85rem] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-dark-50 [&_a]:text-purple-300 [&_a]:no-underline [&_strong]:text-dark-25 [&_blockquote]:border-l-2 [&_blockquote]:border-purple-400/50 [&_blockquote]:pl-4 whitespace-pre-wrap">
                {part.text}
              </div>
            ),
            Reasoning: ({ part }) => (
              <div className="text-sm text-dark-200 mb-2 pl-4 border-l-2 border-purple-400/30">
                <div className="bg-gradient-to-r from-green-300/8 to-green-400/8 border border-green-300/20 border-l-4 border-l-green-300 rounded-lg px-4 py-3 text-green-200 font-medium backdrop-blur-sm">
                  {part.text}
                </div>
              </div>
            ),
          }}
        />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[0.7rem] text-dark-300">
          {formatTimestamp(new Date().toISOString())}
        </span>
        <SpeechButton text={fullText} />
      </div>
    </MessagePrimitive.Root>
  );
}
