import { useMemo } from 'react';

const particles = Array.from({ length: 22 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 6,
  duration: 5 + Math.random() * 6,
  opacity: 0.15 + Math.random() * 0.35,
}));

export default function AmbientBackground() {
  const items = useMemo(() => particles, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-saffron-600/20 blur-[120px]" />
      <div className="absolute -bottom-40 right-1/4 h-[30rem] w-[30rem] rounded-full bg-brass/10 blur-[110px]" />
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-marigold animate-float"
          style={{
            left: `${p.left}%`,
            bottom: '-2rem',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
