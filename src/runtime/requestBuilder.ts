import type { Endpoint } from '../types/endpoint';

export function buildStreamUrl(endpoint: Endpoint): string {
  let url = endpoint.url || 'http://localhost:8000';
  if (url.startsWith('https://localhost')) {
    url = url.replace('https://', 'http://');
  }
  return url;
}

export function buildRegularUrl(endpoint: Endpoint): string {
  return endpoint.url || 'http://localhost:8000/chat';
}

export function buildHeaders(endpoint: Endpoint): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(endpoint.headers || {}),
  };

  if (endpoint.isStreaming) {
    headers['Accept'] = 'text/event-stream';
  }

  if (endpoint.auth?.enabled && endpoint.auth?.token) {
    headers['Authorization'] = `Bearer ${endpoint.auth.token}`;
  }

  return headers;
}

export function buildRequestBody(message: string, threadId: string | null, isStreaming: boolean): string {
  return JSON.stringify({
    ...(threadId ? { thread_id: threadId } : {}),
    messages: { role: 'user', text: message },
    ...(isStreaming ? { stream: true } : {}),
  });
}
