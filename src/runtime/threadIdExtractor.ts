import type { StreamChunkData } from '../types/chat';

function isLikelyId(val: unknown): val is string {
  if (typeof val !== 'string' || !val.trim()) return false;
  if (val.startsWith('thread_')) return true;
  if (/^[0-9a-fA-F-]{16,}$/.test(val)) return true;
  if (val.length >= 12 && /[A-Za-z0-9_-]/.test(val)) return true;
  return false;
}

export function extractThreadId(payload: StreamChunkData | string | unknown, eventType?: string): string | null {
  if (payload && typeof payload === 'object') {
    const p = payload as StreamChunkData;
    const candidates = [
      p.thread_id,
      p.conversation_id,
      p.thread?.id,
      p.thread?.thread_id,
      p.message?.thread_id,
      p.meta?.thread_id,
      p.meta?.conversation_id,
      p.data?.thread_id,
    ].filter(Boolean);
    const found = candidates.find(isLikelyId);
    if (found) return found as string;
  }

  if (typeof payload === 'string') {
    const m1 = payload.match(/\bthread[_ -]?id\b[\u00A0:=\-\\]*["']?([A-Za-z0-9_\-]{8,})["']?/i);
    if (m1 && isLikelyId(m1[1])) return m1[1];

    const m2 = payload.match(/\bconversation[_ -]?id\b[\u00A0:=\-\\]*["']?([A-Za-z0-9_\-]{8,})["']?/i);
    if (m2 && isLikelyId(m2[1])) return m2[1];

    const m3 = payload.match(/\bthread_[A-Za-z0-9_\-]{4,}\b/);
    if (m3 && isLikelyId(m3[0])) return m3[0];
  }

  if (eventType && typeof payload === 'object' && /thread/i.test(eventType)) {
    const p = payload as StreamChunkData;
    if (isLikelyId(p.id)) return p.id as string;
  }

  return null;
}
