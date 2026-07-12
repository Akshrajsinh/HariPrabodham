interface MandalaRingProps {
  size?: number;
  className?: string;
  spin?: boolean;
}

// A hand-built geometric mandala ring (original radial petal pattern), used as a
// soft rotating watermark behind hero/section content to reinforce the temple motif.
export default function MandalaRing({ size = 520, className = '', spin = true }: MandalaRingProps) {
  const petals = Array.from({ length: 16 });
  const dots = Array.from({ length: 24 });
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`${className} ${spin ? 'animate-[spin_120s_linear_infinite]' : ''}`}
      aria-hidden
    >
      <defs>
        <radialGradient id="mandalaGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFA733" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF6B1A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#mandalaGrad)" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="#D4A94A" strokeOpacity="0.25" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#D4A94A" strokeOpacity="0.2" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="46" fill="none" stroke="#D4A94A" strokeOpacity="0.25" strokeWidth="0.5" />
      {petals.map((_, i) => {
        const angle = (360 / petals.length) * i;
        return (
          <ellipse
            key={i}
            cx="100"
            cy="42"
            rx="6"
            ry="16"
            fill="#FFA733"
            fillOpacity="0.12"
            stroke="#D4A94A"
            strokeOpacity="0.3"
            strokeWidth="0.5"
            transform={`rotate(${angle} 100 100)`}
          />
        );
      })}
      {dots.map((_, i) => {
        const angle = (360 / dots.length) * i;
        const rad = (angle * Math.PI) / 180;
        const x = 100 + 82 * Math.cos(rad);
        const y = 100 + 82 * Math.sin(rad);
        return <circle key={i} cx={x} cy={y} r="1.4" fill="#D4A94A" fillOpacity="0.4" />;
      })}
      <circle cx="100" cy="100" r="6" fill="#FFA733" fillOpacity="0.4" />
    </svg>
  );
}
