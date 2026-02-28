import { useState, useCallback, useMemo, useRef } from 'react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { useEndpoints } from '../../context/EndpointContext';
import { useResponseTimeStats } from '../../hooks/useResponseTimeStats';
import { createStableChatAdapter } from '../../runtime/StableChatAdapter';
import { ChatHeader } from './ChatHeader';
import { ChatToggle } from './ChatToggle';
import { CustomThread } from './CustomThread';
import { CustomComposer } from './CustomComposer';
import { useResizeHandle } from '../../hooks/useResizeHandle';

export function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const { activeEndpoint } = useEndpoints();
  const { recordResponseTime, clearResponseTimes } = useResponseTimeStats();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  useResizeHandle(chatContainerRef, resizeHandleRef);

  const statusText = activeEndpoint
    ? `Connected to ${activeEndpoint.name}`
    : 'Check Configuration';

  // Use refs for mutable values so adapter doesn't recreate on every change
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;
  const endpointRef = useRef(activeEndpoint);
  endpointRef.current = activeEndpoint;

  const adapter = useMemo(
    () =>
      createStableChatAdapter({
        getEndpoint: () => endpointRef.current,
        getThreadId: () => threadIdRef.current,
        setThreadId: (id: string) => setThreadId(id),
        onResponseTime: (endpointId, time) => recordResponseTime(endpointId, time),
      }),
    [recordResponseTime]
  );

  const runtime = useLocalRuntime(adapter);

  const handleNewChat = useCallback(() => {
    setThreadId(null);
    if (activeEndpoint) {
      clearResponseTimes(activeEndpoint.id);
    }
    setChatKey(k => k + 1);
  }, [activeEndpoint, clearResponseTimes]);

  return (
    <>
      <ChatToggle onClick={() => setIsOpen(true)} visible={!isOpen} />

      <div
        ref={chatContainerRef}
        className={`fixed bottom-12 right-6 w-[380px] h-[580px] min-w-[300px] min-h-[400px] max-w-[800px] max-h-[90vh] glass-chat rounded-2xl flex flex-col overflow-hidden z-[400] transition-all duration-300 ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-full scale-90 opacity-0 pointer-events-none'
        }`}
      >
        <AssistantRuntimeProvider runtime={runtime} key={chatKey}>
          <ChatHeader
            statusText={statusText}
            threadId={threadId}
            onNewChat={handleNewChat}
            onClose={() => setIsOpen(false)}
          />
          <CustomThread />
          <CustomComposer />
        </AssistantRuntimeProvider>

        {/* Resize Handle — top-left corner (chat is anchored bottom-right) */}
        <div
          ref={resizeHandleRef}
          className="absolute top-0 left-0 w-5 h-5 rounded-br-lg cursor-[nw-resize] opacity-60 transition-all hover:opacity-100 z-[5] hidden md:block"
          style={{
            background: 'linear-gradient(315deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))',
          }}
        >
          <div
            className="absolute top-0.5 left-0.5 w-3 h-3"
            style={{
              backgroundImage:
                'linear-gradient(225deg, transparent 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 8px, transparent 8px), linear-gradient(225deg, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px, transparent 4px)',
              backgroundSize: '8px 8px, 4px 4px',
              backgroundPosition: '0 0, 4px 4px',
            }}
          />
        </div>
      </div>
    </>
  );
}
