import type { ChatModelAdapter, ChatModelRunOptions } from '@assistant-ui/react';
import type { Endpoint } from '../types/endpoint';
import { buildStreamUrl, buildRegularUrl, buildHeaders, buildRequestBody } from './requestBuilder';
import { parseStream, extractTextContent, extractStatusFromChunk, isThinkingStep, extractThinkingText } from './streamParser';
import { extractThreadId } from './threadIdExtractor';

interface AdapterCallbacks {
  getEndpoint: () => Endpoint | undefined;
  getThreadId: () => string | null;
  setThreadId: (id: string) => void;
  onResponseTime?: (endpointId: string, time: number) => void;
}

export function createStableChatAdapter(callbacks: AdapterCallbacks): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      try {
      const endpoint = callbacks.getEndpoint();
      if (!endpoint) {
        yield { content: [{ type: 'text' as const, text: 'No endpoint configured. Please add an API endpoint.' }] };
        return;
      }

      // Extract last user message text
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      const messageText = lastUserMessage?.content
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('\n') || '';

      if (!messageText) return;

      const threadId = callbacks.getThreadId();
      const startTime = performance.now();
      let firstResponseReceived = false;

      if (endpoint.isStreaming) {
        // Streaming mode
        const url = buildStreamUrl(endpoint);
        const headers = buildHeaders(endpoint);
        const body = buildRequestBody(messageText, threadId, true);

        const response = await fetch(url, {
          method: endpoint.method || 'POST',
          headers,
          body,
          signal: abortSignal,
        });

        if (!response.ok) {
          yield { content: [{ type: 'text' as const, text: `Error: HTTP ${response.status}: ${response.statusText}` }] };
          return;
        }

        const reader = response.body!.getReader();
        let accumulatedText = '';
        const reasoningLines: string[] = [];

        for await (const event of parseStream(reader, abortSignal)) {
          const { data, eventType } = event;

          // Extract thread ID
          const tid = extractThreadId(data, eventType);
          if (tid) callbacks.setThreadId(tid);

          // Handle SSE 'done' event type
          if (data.type === 'done') {
            if (data.thread_id) callbacks.setThreadId(data.thread_id);
            continue;
          }

          // Handle 'id' type
          if (data.type === 'id') continue;

          // Detect generic agent status field (works for any agentic backend)
          const agentStatus = extractStatusFromChunk(data);

          if (agentStatus === 'thinking') {
            if (reasoningLines.length === 0) reasoningLines.push('Thinking...');
            yield { content: [{ type: 'reasoning' as const, text: reasoningLines.join('\n') }] };
            continue;
          }

          if (agentStatus === 'tool_calling') {
            reasoningLines.push('Calling tools...');
            yield { content: [{ type: 'reasoning' as const, text: reasoningLines.join('\n') }] };
            continue;
          }

          if (agentStatus === 'done') continue;

          // 'streaming' status or no status — this is real response text
          const text = extractTextContent(data);
          if (!text) continue;

          // Record response time on first real content
          if (!firstResponseReceived) {
            firstResponseReceived = true;
            const elapsed = performance.now() - startTime;
            if (callbacks.onResponseTime) {
              callbacks.onResponseTime(endpoint.id, elapsed);
            }
          }

          // Emoji-based thinking detection: fallback for backends that embed
          // thinking indicators in text (no status field)
          if (!agentStatus && isThinkingStep(text)) {
            const stepText = extractThinkingText(text);
            if (stepText) reasoningLines.push(stepText);
          }

          accumulatedText += text;

          const contentParts: Array<{ type: 'text'; text: string } | { type: 'reasoning'; text: string }> = [];
          if (reasoningLines.length > 0) {
            contentParts.push({ type: 'reasoning' as const, text: reasoningLines.join('\n') });
          }
          contentParts.push({ type: 'text' as const, text: accumulatedText });

          yield { content: contentParts };
        }
      } else {
        // Regular (non-streaming) mode
        const url = buildRegularUrl(endpoint);
        const headers = buildHeaders(endpoint);
        const body = buildRequestBody(messageText, threadId, false);

        const response = await fetch(url, {
          method: endpoint.method || 'POST',
          headers,
          body,
          signal: abortSignal,
        });

        if (!response.ok) {
          yield { content: [{ type: 'text' as const, text: `Error: HTTP ${response.status}: ${response.statusText}` }] };
          return;
        }

        const data = await response.json();

        // Record response time
        const elapsed = performance.now() - startTime;
        if (callbacks.onResponseTime) {
          callbacks.onResponseTime(endpoint.id, elapsed);
        }

        // Extract thread ID
        if (data.thread_id) callbacks.setThreadId(data.thread_id);
        if (data.conversation_id) callbacks.setThreadId(data.conversation_id);

        const text = data.error
          ? data.text || 'An error occurred'
          : data.text || 'No response';

        yield { content: [{ type: 'text' as const, text }] };
      }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : String(err);
        yield { content: [{ type: 'text' as const, text: `⚠️ Error: ${msg}` }] };
      }
    },
  };
}
