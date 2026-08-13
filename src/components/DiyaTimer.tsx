import { motion } from 'framer-motion';

interface DiyaTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: number;
  running?: boolean;
}

export default function DiyaTimer({ secondsLeft, totalSeconds, size = 140, running = false }: DiyaTimerProps) {
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const strokeWidth = Math.max(6, Math.floor(size * 0.055));
  const radius = size / 2 - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const isCritical = secondsLeft <= 5 && secondsLeft > 0;
  const isDanger = secondsLeft <= 10;

  const fontSize = Math.max(16, Math.floor(size * 0.21));
  const flameHeight = Math.max(14, Math.floor(size * 0.16));
  const flameWidth = Math.max(8, Math.floor(size * 0.09));
  const baseWidth = Math.max(28, Math.floor(size * 0.32));

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {/* Glow Aura Backdrop */}
      <div
        className="absolute inset-1 rounded-full opacity-30 blur-md pointer-events-none"
        style={{ background: isDanger ? '#EF4444' : '#FFA733' }}
      />

      <svg width={size} height={size} className="-rotate-90 relative z-10">
        {/* Outer Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,167,51,0.18)"
          strokeWidth={strokeWidth}
          fill="rgba(0,0,0,0.35)"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDanger ? '#EF4444' : '#FFA733'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 10px ${isDanger ? '#EF4444CC' : '#FFA733CC'})` }}
        />
      </svg>

      <div className="absolute z-20 flex flex-col items-center justify-center inset-0 pointer-events-none">
        {/* Diya Flame */}
        <div className="relative flex justify-center items-end" style={{ height: flameHeight + 4 }}>
          <motion.div
            className={`rounded-[50%_50%_50%_50%/60%_60%_40%_40%] ${
              running ? 'animate-flicker' : ''
            }`}
            style={{
              width: flameWidth,
              height: isCritical ? flameHeight + 4 : flameHeight,
              background: isDanger
                ? 'linear-gradient(180deg, #FFD08A 0%, #EF4444 80%)'
                : 'linear-gradient(180deg, #FFFFFF 0%, #FFA733 45%, #FF6B1A 100%)',
              boxShadow: `0 0 16px 5px ${isDanger ? '#EF4444AA' : '#FFA733AA'}`,
            }}
          />
        </div>
        {/* Diya Base */}
        <div
          className="h-2.5 rounded-b-full shadow-md"
          style={{ width: baseWidth, background: 'linear-gradient(180deg,#FFA733,#B84300)' }}
        />
        {/* Digital Countdown Number */}
        <span
          className="mt-1 font-score font-extrabold tabular-nums text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          style={{ fontSize }}
        >
          {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
