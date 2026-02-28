export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: string;
  isError?: boolean;
}

export interface StreamChunkData {
  type?: string;
  content?: string;
  response?: string;
  text?: string;
  delta?: { content?: string };
  thread_id?: string;
  conversation_id?: string;
  thread?: { id?: string; thread_id?: string };
  message?: { thread_id?: string };
  meta?: { thread_id?: string; conversation_id?: string };
  data?: { thread_id?: string };
  role?: string;
  error?: string | { details?: string };
  stream_end?: boolean;
  value?: string;
  id?: string;
}

export interface ThinkingStep {
  id: string;
  text: string;
}
