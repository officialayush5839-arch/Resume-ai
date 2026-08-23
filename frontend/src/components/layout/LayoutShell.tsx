import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { MobileNav } from './MobileNav';
import { AmbientGlow } from './AmbientGlow';

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0A0E1A] text-slate-100 font-sans overflow-hidden relative selection:bg-indigo-500/30 selection:text-white">
      {/* Ambient Radial Glow mesh */}
      <AmbientGlow />

      {/* Desktop Frosted Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <Topbar onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default LayoutShell;
