import { useLocation, Link } from 'react-router-dom';
import { 
  Bell, 
  Menu, 
  ChevronRight, 
  UploadCloud, 
  PlusCircle, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';

interface TopbarProps {
  onToggleMobileNav?: () => void;
}

interface Crumb {
  label: string;
  path?: string;
}

export default function Topbar({ onToggleMobileNav }: TopbarProps) {
  const location = useLocation();

  // Generate dynamic breadcrumb segments
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbs = (): Crumb[] => {
    if (pathSegments.length === 0) {
      return [{ label: 'Dashboard', path: '/' }];
    }
    const crumbs: Crumb[] = [{ label: 'Dashboard', path: '/' }];
    let currentPath = '';
    
    pathSegments.forEach((segment, idx) => {
      currentPath += `/${segment}`;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === 'upload') label = 'Resume Upload';
      if (segment === 'candidates') label = 'Candidates Directory';
      if (segment === 'jobs') label = 'Jobs & Requisitions';
      if (!isNaN(Number(segment))) label = `#${segment}`;
      crumbs.push({ label, path: idx === pathSegments.length - 1 ? undefined : currentPath });
    });
    
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 sticky top-0 z-30 shrink-0 select-none">
      {/* Left: Mobile Drawer Trigger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors focus:outline-none cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />}
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-500 dark:text-slate-400"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Quick Action CTAs & Profile */}
      <div className="flex items-center gap-3">
        <Link to="/upload">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            className="hidden md:inline-flex text-xs py-1.5"
          >
            Upload Resume
          </Button>
        </Link>

        <Link to="/jobs">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-3.5 h-3.5 text-white" />}
            className="hidden sm:inline-flex text-xs py-1.5"
          >
            Create Job
          </Button>
        </Link>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors focus:outline-none cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />

        {/* User Cockpit Avatar */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              Recruiter Cockpit
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Enterprise Edition</p>
          </div>
        </div>
      </div>
    </header>
  );
}
