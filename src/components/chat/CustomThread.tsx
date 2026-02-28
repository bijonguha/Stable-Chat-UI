import { ThreadPrimitive } from '@assistant-ui/react';
import { CustomUserMessage } from './CustomUserMessage';
import { CustomAssistantMessage } from './CustomAssistantMessage';

export function CustomThread() {
  return (
    <ThreadPrimitive.Root className="flex flex-col flex-1 overflow-hidden">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <ThreadPrimitive.Empty>
          <div className="flex flex-col max-w-[80%] self-start">
            <div className="bubble-assistant text-dark-50 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
              Hi! I'm your AI assistant. How can I help?
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: CustomUserMessage,
            AssistantMessage: CustomAssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
