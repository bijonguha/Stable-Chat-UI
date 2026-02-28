import type { StreamChunkData } from '../types/chat';

export interface ParsedStreamEvent {
  data: StreamChunkData;
  eventType?: string;
}

/**
 * Extract text content from a parsed chunk, handling various API response formats.
 */
export function extractTextContent(data: StreamChunkData): string {
  if (data.type === 'text_sql' || data.type === 'data') {
    return data.content || '';
  }
  if (data.type === 'error') {
    return data.content || `Error: ${data.error || 'Unknown error'}`;
  }
  if (data.stream_end) return '';
  if (data.content) return data.content;
  if (data.response) return data.response;
  if (data.text) return data.text;
  if (data.delta?.content) return data.delta.content;
  if (typeof data === 'string') return data;
  return '';
}

/**
 * Check if a text chunk contains thinking step indicators.
 */
export function isThinkingStep(text: string): boolean {
  return text.includes('⚙️ *Executing') || text.includes('🔍') || text.includes('📈 *Generating insights*');
}

/**
 * Extract thinking step text from a message.
 */
export function extractThinkingText(text: string): string | null {
  const match = text.match(/(⚙️ \*[^*]+\*|🔍[^\n]*|📈 \*[^*]+\*)/);
  return match ? match[1] : null;
}

/**
 * Parse an async stream of bytes into structured events.
 * Handles SSE (data: prefix), line-delimited JSON, and plain text.
 */
export async function* parseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<ParsedStreamEvent> {
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEventType: string | undefined;

  try {
    while (true) {
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) {
        // Flush remaining buffer
        if (buffer.trim()) {
          yield* processLine(buffer.trim(), currentEventType);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let eolIndex: number;
      while ((eolIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, eolIndex).trim();
        buffer = buffer.slice(eolIndex + 1);

        if (line === '') {
          currentEventType = undefined;
          continue;
        }

        if (line.startsWith('event:')) {
          currentEventType = line.substring(6).trim();
          continue;
        }

        yield* processLine(line, currentEventType);
      }

      // Timeout flush for incomplete plain text
      if (buffer.length > 0 && !buffer.includes('{') && !buffer.startsWith('data:')) {
        // Let it accumulate for a bit; the next chunk will flush it
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function* processLine(line: string, eventType?: string): Generator<ParsedStreamEvent> {
  if (!line) return;

  // SSE format: "data: ..."
  if (line.startsWith('data:')) {
    const dataStr = line.substring(5).trim();
    if (!dataStr || dataStr === '[DONE]') return;

    try {
      const data = JSON.parse(dataStr);
      yield { data, eventType };
    } catch {
      yield { data: { content: dataStr }, eventType };
    }
    return;
  }

  // Line-delimited JSON
  if (line.startsWith('{')) {
    try {
      const data = JSON.parse(line);
      yield { data, eventType };
    } catch {
      yield { data: { content: line }, eventType };
    }
    return;
  }

  // Plain text
  yield { data: { content: line }, eventType };
}
