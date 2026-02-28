import { useState } from 'react';
import { Header } from './Header';
import { MenuButton, SideNav } from './MenuPanel';
import { EndpointList } from '../endpoints/EndpointList';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <>
      <MenuButton
        isOpen={isSideNavOpen}
        onToggle={() => setIsSideNavOpen(prev => !prev)}
      />
      <SideNav
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
      />

      <div className="flex flex-col items-center justify-center min-h-screen p-8 pt-8 relative z-[1]">
        <Header />
        <EndpointList />
      </div>

      {/* Chat overlay */}
      {children}

      <footer className="fixed bottom-0 left-0 right-0 text-center py-3 text-dark-300 text-xs z-[1]">
        <p>
          Developed with ❤️ by{' '}
          <a
            href="https://www.linkedin.com/in/bijonguha/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 no-underline hover:text-purple-200"
          >
            Bijon Guha
          </a>
        </p>
      </footer>
    </>
  );
}
