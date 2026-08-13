import { useMemo } from 'react';

const particles = Array.from({ length: 32 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 6,
  duration: 6 + Math.random() * 7,
  opacity: 0.35 + Math.random() * 0.45,
}));

export default function AmbientBackground() {
  const items = useMemo(() => particles, []);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#2D1405] via-[#200D03] to-[#140701]">
      {/* Dynamic Saffron Ambient Mesh Lights */}
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute -top-32 left-1/3 h-[48rem] w-[48rem] rounded-full bg-saffron-500/30 blur-[140px] animate-pulse-glow" />
      <div className="absolute top-1/3 -left-36 h-[40rem] w-[40rem] rounded-full bg-marigold/25 blur-[130px]" />
      <div className="absolute -bottom-32 right-1/4 h-[44rem] w-[44rem] rounded-full bg-saffron-600/25 blur-[140px]" />

      {/* Floating Golden Sparks */}
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-gradient-to-t from-marigold to-saffron-400 animate-float shadow-[0_0_12px_#FFA733]"
          style={{
            left: `${p.left}%`,
            bottom: '-2rem',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Fine Noise Texture */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.02]" aria-hidden>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}
