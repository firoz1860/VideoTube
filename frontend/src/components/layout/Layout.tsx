import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // On every navigation: close the mobile sidebar and reset the scroll
  // position to the top. The scroll container is <main> (not the window), so
  // without this a new page would open scrolled to the previous page's offset.
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0F1729] text-white overflow-x-hidden">
      <Navbar onMenuClick={() => setIsMobileSidebarOpen((v) => !v)} />
      <div className="flex min-h-[calc(100vh-52px)]">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main ref={mainRef} className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
