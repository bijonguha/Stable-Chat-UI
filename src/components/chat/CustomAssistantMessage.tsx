import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import { formatTimestamp } from '../../utils/formatters';
import { SpeechButton } from './SpeechButton';
import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type ReasoningProps = {
  status?: { type: string };
  text?: string;
  children?: React.ReactNode;
};

function ReasoningBlock({ status, text }: ReasoningProps) {
  const isRunning = status?.type === 'running';
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-400/20 hover:bg-dark-400/30 transition-all cursor-pointer w-full text-left"
      >
        {isRunning ? (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-green-400/40 flex-shrink-0" />
        )}
        <span className="text-xs text-dark-200 font-medium flex-1">
          {isRunning ? 'Thinking...' : 'Thought process'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-dark-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="mt-1 px-3 py-2 rounded-lg border border-green-300/20 border-l-4 border-l-green-300 bg-green-300/5 text-green-200 text-xs leading-relaxed whitespace-pre-wrap">
          {text || (isRunning ? '...' : '')}
        </div>
      )}
    </div>
  );
}

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
            Text: (_props: any) => (
              <MarkdownTextPrimitive
                smooth
                className="[&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-dark-400/30 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-2 [&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-amber-400 [&_code]:text-[0.85rem] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-dark-50 [&_a]:text-purple-300 [&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-purple-400/50 [&_blockquote]:pl-4 [&_blockquote]:text-dark-200 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold"
              />
            ),
            Reasoning: (props: any) => (
              <ReasoningBlock status={props.status} text={props.text} />
            ),
          }}
        />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[0.7rem] text-dark-300">
          {formatTimestamp(message.createdAt.toISOString())}
        </span>
        <SpeechButton text={fullText} />
      </div>
    </MessagePrimitive.Root>
  );
}
