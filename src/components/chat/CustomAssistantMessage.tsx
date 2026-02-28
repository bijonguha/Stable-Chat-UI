import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import { formatTimestamp } from '../../utils/formatters';
import { SpeechButton } from './SpeechButton';
import { useMemo, useState } from 'react';
import { ChevronDown, Code2 } from 'lucide-react';
import remarkGfm from 'remark-gfm';

type ReasoningProps = {
  status?: { type: string };
  text?: string;
  children?: React.ReactNode;
};

function ReasoningBlock({ status, text }: ReasoningProps) {
  const isRunning = status?.type === 'running';
  const [isOpen, setIsOpen] = useState(false);

  const steps = text ? text.split('\n').filter(Boolean) : [];
  const currentStep = steps[steps.length - 1] ?? '...';
  const stepCount = steps.length;

  if (isRunning) {
    return (
      <div className="flex items-center gap-2 mb-2 text-xs text-dark-300">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <span>{currentStep}</span>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1.5 text-[0.7rem] text-dark-400 hover:text-dark-200 transition-colors cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-dark-400/50 flex-shrink-0" />
        <span>Thought for {stepCount} step{stepCount !== 1 ? 's' : ''}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-1.5 pl-3 border-l border-dark-400/30 flex flex-col gap-0.5">
          {steps.map((step, i) => (
            <span key={i} className="text-[0.7rem] text-dark-400">{step}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScrollableTable({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto my-2 rounded-lg border border-dark-400/20">
      <table {...props} className="w-full border-collapse text-sm min-w-max">
        {children}
      </table>
    </div>
  );
}

function CollapsibleCodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="my-2 rounded-lg border border-dark-400/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-black/50 text-dark-200 text-xs hover:bg-black/60 transition-colors text-left cursor-pointer"
      >
        <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 font-mono">code</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <pre {...props} className="overflow-x-auto p-4 bg-black/40 text-dark-50 text-sm leading-relaxed m-0">
          {children}
        </pre>
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
                remarkPlugins={[remarkGfm]}
                components={{ pre: CollapsibleCodeBlock as any, table: ScrollableTable as any }}
                className="[&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-amber-400 [&_code]:text-[0.85rem] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-dark-50 [&_a]:text-purple-300 [&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-purple-400/50 [&_blockquote]:pl-4 [&_blockquote]:text-dark-200 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_table]:border-collapse [&_table]:text-sm [&_th]:bg-dark-400/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:border [&_th]:border-dark-400/30 [&_td]:border [&_td]:border-dark-400/30 [&_td]:px-3 [&_td]:py-2 [&_td]:whitespace-nowrap [&_tr:nth-child(even)]:bg-dark-400/10"
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
