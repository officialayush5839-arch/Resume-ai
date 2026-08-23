import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Users, 
  Briefcase, 
  Sparkles,
  Zap
} from 'lucide-react';
import { PulseDot } from '../../utils/icons';

export const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    badge: undefined,
  },
  {
    label: 'Upload Resume',
    path: '/upload',
    icon: UploadCloud,
    badge: 'AI Parse',
  },
  {
    label: 'Candidates',
    path: '/candidates',
    icon: Users,
    badge: undefined,
  },
  {
    label: 'Jobs & Matching',
    path: '/jobs',
    icon: Briefcase,
    badge: undefined,
  },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`w-64 h-screen bg-slate-950/80 backdrop-blur-2xl border-r border-white/10 text-slate-100 flex flex-col justify-between shrink-0 relative z-20 select-none ${className}`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight gradient-brand-text">ResumeIQ</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Intelligent Candidate Screening</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 mt-2">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: active }) =>
                  `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                    active || isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive: active }) => (
                  <>
                    {(active || isActive) && (
                      <motion.div
                        layoutId="activeSidebarPill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/15 border border-indigo-500/40 rounded-xl shadow-inner shadow-indigo-500/10"
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors duration-200 ${
                          active || isActive
                            ? 'text-indigo-400'
                            : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry & Status Card */}
      <div className="p-4 space-y-3">
        <div className="glass-card p-3.5 bg-slate-900/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <PulseDot color="bg-emerald-400" />
              <span>AI Engine Online</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              99.9%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            FastAPI + NLP parser ready. Semantic similarity active.
          </p>
        </div>

        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 border-t border-white/5 pt-3">
          <span>ResumeIQ v2.0 Pro</span>
          <span className="text-slate-400">Quantum Glass</span>
        </div>
      </div>
    </aside>
  );
}
