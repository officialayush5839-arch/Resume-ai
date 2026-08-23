import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type CardVariant = 'default' | 'interactive' | 'elevated' | 'glow';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  variant?: CardVariant;
  glowColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', glowColor = 'indigo', className = '', ...props }, ref) => {
    const variantClasses: Record<CardVariant, string> = {
      default: 'glass-card p-6',
      interactive: 'glass-card-interactive p-6 cursor-pointer',
      elevated: 'glass-card-elevated p-6',
      glow: 'glass-card p-6 relative overflow-hidden',
    };

    const glowColorClass = {
      indigo: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      emerald: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      amber: 'from-amber-500/10 via-yellow-500/5 to-transparent',
      rose: 'from-rose-500/10 via-pink-500/5 to-transparent',
      cyan: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    }[glowColor];

    return (
      <motion.div
        ref={ref}
        className={`${variantClasses[variant]} ${className}`}
        {...props}
      >
        {variant === 'glow' && (
          <div
            className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${glowColorClass} rounded-full blur-2xl pointer-events-none`}
          />
        )}
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-slate-900 dark:text-slate-100 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-4 pt-4 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between ${className}`}>{children}</div>;
}
