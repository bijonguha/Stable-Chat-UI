import type { ChatModelAdapter, ChatModelRunOptions } from '@assistant-ui/react';
import type { Endpoint } from '../types/endpoint';
import { buildStreamUrl, buildRegularUrl, buildHeaders, buildRequestBody } from './requestBuilder';
import { parseStream, extractTextContent, isThinkingStep, extractThinkingText } from './streamParser';
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
        let fullText = '';
        const thinkingSteps: string[] = [];

        for await (const event of parseStream(reader, abortSignal)) {
          const { data, eventType } = event;

          // Extract thread ID
          const tid = extractThreadId(data, eventType);
          if (tid) callbacks.setThreadId(tid);

          // Handle SSE 'done' event
          if (data.type === 'done') {
            if (data.thread_id) callbacks.setThreadId(data.thread_id);
            continue;
          }

          // Handle 'id' type
          if (data.type === 'id') continue;

          // Record response time on first content
          if (!firstResponseReceived) {
            firstResponseReceived = true;
            const elapsed = performance.now() - startTime;
            if (callbacks.onResponseTime) {
              callbacks.onResponseTime(endpoint.id, elapsed);
            }
          }

          // Extract text content
          const text = extractTextContent(data);
          if (!text) continue;

          // Check for thinking steps
          if (isThinkingStep(text)) {
            const stepText = extractThinkingText(text);
            if (stepText) thinkingSteps.push(stepText);
          }

          fullText += text;

          // Build content parts
          const contentParts: Array<{ type: 'text'; text: string } | { type: 'reasoning'; text: string }> = [];

          // Add thinking steps as reasoning parts
          if (thinkingSteps.length > 0) {
            contentParts.push({
              type: 'reasoning' as const,
              text: thinkingSteps.join('\n'),
            });
          }

          contentParts.push({ type: 'text' as const, text: fullText });

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
    },
  };
}
