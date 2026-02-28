import type { Endpoint } from '../../types/endpoint';
import { StreamingBadge, RegularBadge, AuthBadge, ResponseTimeBadge } from './EndpointBadges';
import { useResponseTimeStats } from '../../hooks/useResponseTimeStats';

interface EndpointCardProps {
  endpoint: Endpoint;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EndpointCard({ endpoint, isActive, onActivate, onEdit, onDelete }: EndpointCardProps) {
  const { getAverageResponseTime } = useResponseTimeStats();
  const avgTime = getAverageResponseTime(endpoint.id);

  return (
    <div
      className={`glass rounded-xl p-5 flex justify-between items-center transition-all duration-300 hover:glass-hover hover:-translate-y-0.5 hover:shadow-lg ${
        isActive ? 'border-purple-400 shadow-[0_0_30px_rgba(139,92,246,0.2)]' : ''
      }`}
    >
      <div>
        <h3 className="text-[0.95rem] font-medium text-dark-25 mb-1">
          {endpoint.name}
          {endpoint.isStreaming ? <StreamingBadge /> : <RegularBadge />}
          {endpoint.auth?.enabled && <AuthBadge />}
          <ResponseTimeBadge time={avgTime} isStreaming={endpoint.isStreaming} />
        </h3>
        <p className="text-sm text-dark-200 font-mono">{endpoint.url}</p>
      </div>

      <div className="flex gap-2">
        {!isActive ? (
          <button
            onClick={onActivate}
            className="btn-gradient-purple text-white px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none"
          >
            Use
          </button>
        ) : (
          <span className="badge-active text-white px-2 py-1 rounded text-[0.7rem] font-medium">
            Active
          </span>
        )}
        <button
          onClick={onEdit}
          className="bg-dark-400/80 border border-dark-400/50 text-dark-100 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all hover:bg-dark-300/80"
        >
          Edit
        </button>
        {!endpoint.isDefault && (
          <button
            onClick={onDelete}
            className="bg-dark-400/80 border border-dark-400/50 text-dark-100 px-3 py-1.5 rounded-md text-xs cursor-pointer transition-all hover:btn-gradient-red hover:text-white hover:border-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
