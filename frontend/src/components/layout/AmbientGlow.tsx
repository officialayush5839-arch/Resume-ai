import { motion } from 'framer-motion';

export function AmbientGlow() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Top Left Indigo Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.18, 0.12],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/15 to-purple-400/10 dark:from-indigo-600/25 dark:to-purple-600/15 rounded-full blur-3xl"
      />

      {/* Bottom Right Emerald Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.14, 0.08],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] bg-gradient-to-tl from-emerald-400/15 to-teal-400/10 dark:from-emerald-500/20 dark:to-teal-500/10 rounded-full blur-3xl"
      />

      {/* Center Subtle Violet Node */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.04, 0.08, 0.04],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-purple-400/10 via-indigo-400/8 to-pink-400/8 dark:from-purple-600/15 dark:via-indigo-600/10 dark:to-pink-600/10 rounded-full blur-[120px]"
      />

      {/* Fine SVG Grid Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.018] text-slate-900 dark:text-white"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
}
