import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export type BadgeVariant = 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple' | 'slate';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  onRemove?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'indigo',
  size = 'md',
  dot = false,
  pulse = false,
  onRemove,
  className = '',
  icon,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string; text: string }> = {
    indigo: {
      container: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:border-indigo-400/50',
      dot: 'bg-indigo-400',
      text: 'text-indigo-300',
    },
    emerald: {
      container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/50',
      dot: 'bg-emerald-400',
      text: 'text-emerald-300',
    },
    amber: {
      container: 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400/50',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
    },
    rose: {
      container: 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:border-rose-400/50',
      dot: 'bg-rose-400',
      text: 'text-rose-300',
    },
    cyan: {
      container: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:border-cyan-400/50',
      dot: 'bg-cyan-400',
      text: 'text-cyan-300',
    },
    purple: {
      container: 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:border-purple-400/50',
      dot: 'bg-purple-400',
      text: 'text-purple-300',
    },
    slate: {
      container: 'bg-slate-800/60 border-white/10 text-slate-300 hover:border-white/20',
      dot: 'bg-slate-400',
      text: 'text-slate-300',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const currentVariant = variantStyles[variant];

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md transition-all select-none ${currentVariant.container} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentVariant.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentVariant.dot}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-0.5 p-0.5 rounded-full hover:bg-white/15 text-current transition-colors focus:outline-none cursor-pointer"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.span>
  );
}
