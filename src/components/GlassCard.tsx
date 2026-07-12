import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  arch?: boolean;
  glow?: 'none' | 'saffron' | 'green' | 'red';
  as?: 'div';
  delay?: number;
}

const glowMap = {
  none: '',
  saffron: 'shadow-glow',
  green: 'shadow-glow-green',
  red: 'shadow-glow-red',
};

export default function GlassCard({ children, className, arch, glow = 'none', delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        'glass rounded-3xl',
        arch && 'temple-arch-top',
        glowMap[glow],
        'bg-arch-gradient',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
