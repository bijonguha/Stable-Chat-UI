import { MessageCircle } from 'lucide-react';

interface ChatToggleProps {
  onClick: () => void;
  visible: boolean;
}

export function ChatToggle({ onClick, visible }: ChatToggleProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-12 right-6 w-14 h-14 chat-toggle-gradient border-none rounded-2xl text-white text-xl cursor-pointer transition-all z-[500] flex items-center justify-center hover:scale-105 hover:-translate-y-0.5"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
