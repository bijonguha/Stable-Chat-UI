import type { Endpoint } from '../types/endpoint';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

// Local dev servers are commonly configured with a self-signed/absent TLS
// cert; downgrade to plaintext only for an exact loopback hostname match,
// never for a hostname that merely starts with "localhost".
function downgradeLocalHttps(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && LOCAL_HOSTNAMES.has(parsed.hostname)) {
      parsed.protocol = 'http:';
      return parsed.toString();
    }
  } catch {
    // Not a valid absolute URL — leave it untouched.
  }
  return url;
}

export function buildStreamUrl(endpoint: Endpoint): string {
  return downgradeLocalHttps(endpoint.url || 'http://localhost:8000');
}

export function buildRegularUrl(endpoint: Endpoint): string {
  return downgradeLocalHttps(endpoint.url || 'http://localhost:8000/chat');
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
