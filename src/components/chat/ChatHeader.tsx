import { Plus, X } from 'lucide-react';

interface ChatHeaderProps {
  statusText: string;
  threadId: string | null;
  onNewChat: () => void;
  onClose: () => void;
}

export function ChatHeader({ statusText, threadId, onNewChat, onClose }: ChatHeaderProps) {
  return (
    <div className="glass-header p-4 border-b border-dark-400/20 text-center relative">
      <h2 className="text-lg font-medium text-dark-25 mb-1">AI Chat</h2>
      <div className="text-sm text-dark-200 flex items-center justify-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-dot" />
        <span>{statusText}</span>
      </div>

      {threadId && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-purple-400/90 text-white rounded-md text-[0.6rem] shadow-[0_2px_8px_rgba(139,92,246,0.3)] backdrop-blur-sm z-10">
          <span className="font-medium opacity-80">Thread ID:</span>
          <span className="font-mono font-semibold">{threadId}</span>
        </div>
      )}

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="absolute top-2.5 right-14 flex items-center gap-1 px-2.5 py-1.5 btn-gradient-green border-none rounded-lg text-white text-xs font-medium cursor-pointer transition-all z-[3] shadow-[0_2px_10px_rgba(16,185,129,0.2)] hover:-translate-y-px"
        title="Start New Chat Session"
      >
        <Plus className="w-3.5 h-3.5 font-bold" />
        <span className="text-[0.7rem] tracking-wide">New</span>
      </button>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-lg bg-purple-400/10 text-purple-400 border border-purple-400/20 shadow-[0_2px_10px_rgba(139,92,246,0.1)] flex items-center justify-center cursor-pointer transition-all z-[2] hover:bg-gradient-to-br hover:from-red-500 hover:to-red-600 hover:text-white hover:border-transparent"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
