import { Zap, Check, Lock, Clock } from 'lucide-react';

export function StreamingBadge() {
  return (
    <span className="badge-streaming inline-flex items-center ml-2 px-2 py-0.5 rounded-xl text-[0.65rem] font-semibold tracking-wide text-white">
      <Zap className="w-3 h-3 mr-1 animate-pulse-subtle" />
      STREAMING
    </span>
  );
}

export function RegularBadge() {
  return (
    <span className="badge-regular inline-flex items-center ml-2 px-2 py-0.5 rounded-xl text-[0.65rem] font-semibold tracking-wide text-dark-50">
      <Check className="w-3 h-3 mr-1" />
      REGULAR
    </span>
  );
}

export function AuthBadge() {
  return (
    <span className="badge-auth inline-flex items-center ml-2 px-2 py-0.5 rounded-xl text-[0.65rem] font-semibold tracking-wide text-white">
      <Lock className="w-3 h-3 mr-1" />
      AUTH
    </span>
  );
}

export function ResponseTimeBadge({ time, isStreaming }: { time: number | null; isStreaming: boolean }) {
  const valueMs = time ?? 0;
  const seconds = (valueMs / 1000).toFixed(1);
  const label = isStreaming ? 'Avg TTFB ' : '';
  const tooltip = isStreaming
    ? 'Average time to first byte (first streamed chunk) from request start'
    : 'Average full round-trip time';

  return (
    <span
      className="badge-response-time inline-flex items-center ml-2 px-2 py-0.5 rounded-xl text-[0.65rem] font-semibold tracking-wide text-white animate-fade-in"
      title={tooltip}
    >
      <Clock className="w-3 h-3 mr-1" />
      {label}{seconds}s
    </span>
  );
}
