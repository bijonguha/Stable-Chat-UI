export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function generateId(): string {
  return Date.now().toString();
}

export function formatResponseTime(ms: number): string {
  return (ms / 1000).toFixed(1);
}
