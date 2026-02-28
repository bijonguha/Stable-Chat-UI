import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { formatTimestamp } from '../../utils/formatters';

export function CustomUserMessage() {
  const message = useMessage();
  return (
    <MessagePrimitive.Root className="flex flex-col max-w-[80%] self-end">
      <div className="bubble-user text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed">
        <MessagePrimitive.Content />
      </div>
      <div className="text-[0.7rem] text-dark-300 mt-1 text-right">
        {formatTimestamp(message.createdAt.toISOString())}
      </div>
    </MessagePrimitive.Root>
  );
}
