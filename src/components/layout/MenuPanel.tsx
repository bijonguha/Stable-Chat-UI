import { useState } from 'react';
import { Menu, X, ExternalLink, Info, BookOpen, Home, ChevronDown } from 'lucide-react';

interface MenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MenuButton({ isOpen, onToggle }: MenuButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onToggle}
      className="fixed top-4 left-4 z-[700] w-10 h-10 rounded-lg glass glass-hover flex items-center justify-center cursor-pointer border-none transition-all duration-200 hover:scale-105"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5 text-dark-100" />
    </button>
  );
}

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideNav({ isOpen, onClose }: SideNavProps) {
  const [aboutExpanded, setAboutExpanded] = useState(false);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[640] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Side nav panel */}
      <nav
        className={`fixed top-0 left-0 h-full w-72 z-[650] glass-sidenav flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="px-5 pt-6 pb-4 border-b border-dark-400/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm text-white">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-dark-25 font-semibold text-base leading-tight">Stable Chat</h1>
              <p className="text-dark-300 text-xs">Universal Chat Interface</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer bg-transparent border-none text-dark-300 hover:text-dark-100 hover:bg-dark-400/30 transition-all flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Home */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-100 hover:text-dark-25 hover:bg-dark-400/30 transition-all no-underline text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </a>

          {/* About (expandable) */}
          <div>
            <button
              onClick={() => setAboutExpanded(!aboutExpanded)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-100 hover:text-dark-25 hover:bg-dark-400/30 transition-all cursor-pointer bg-transparent border-none text-sm text-left"
            >
              <Info className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">About</span>
              <ChevronDown
                className={`w-4 h-4 text-dark-300 transition-transform duration-200 ${
                  aboutExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {aboutExpanded && (
              <div className="mx-3 mt-1 px-3 py-3 rounded-lg bg-dark-400/20 animate-fade-in">
                <h3 className="text-dark-25 font-medium text-sm mb-2">Stable Chat UI</h3>
                <p className="text-dark-200 text-xs leading-relaxed mb-3">
                  A modern, universal chat interface for connecting to any AI service via configurable API endpoints.
                </p>
                <h4 className="text-dark-100 font-medium text-xs mb-1.5">Quick Start</h4>
                <ol className="list-decimal list-inside space-y-0.5 text-dark-200 text-xs">
                  <li>Click "+ Add Endpoint"</li>
                  <li>Enter endpoint name &amp; URL</li>
                  <li>Configure headers with your API key</li>
                  <li>Toggle streaming if supported</li>
                  <li>Click Save and start chatting</li>
                </ol>
              </div>
            )}
          </div>

          {/* Docs */}
          <a
            href="https://github.com/bijonguha/Stable-Chat-UI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-100 hover:text-dark-25 hover:bg-dark-400/30 transition-all no-underline text-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span className="flex-1">Documentation</span>
            <ExternalLink className="w-3.5 h-3.5 text-dark-300" />
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-dark-400/20">
          <p className="text-dark-400 text-xs text-center">
            Stable Chat UI v1.0
          </p>
        </div>
      </nav>
    </>
  );
}
