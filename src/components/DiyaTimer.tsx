import { motion } from 'framer-motion';

interface DiyaTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: number;
  running?: boolean;
}

export default function DiyaTimer({ secondsLeft, totalSeconds, size = 180, running = false }: DiyaTimerProps) {
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const isCritical = secondsLeft <= 5 && secondsLeft > 0;
  const isDanger = secondsLeft <= 10;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(212,169,74,0.18)"
          strokeWidth={8}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDanger ? '#DC2626' : '#FFA733'}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 8px ${isDanger ? '#DC262699' : '#FFA73399'})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        {/* diya flame */}
        <div className="relative -mb-1 h-8 w-4">
          <motion.div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] ${
              running ? 'animate-flicker' : ''
            }`}
            style={{
              width: 12,
              height: isCritical ? 26 : 20,
              background: isDanger
                ? 'linear-gradient(180deg, #FFD08A 0%, #DC2626 80%)'
                : 'linear-gradient(180deg, #FFF3EA 0%, #FFA733 45%, #FF6B1A 100%)',
              boxShadow: `0 0 14px 4px ${isDanger ? '#DC262688' : '#FFA73388'}`,
            }}
          />
        </div>
        {/* diya base */}
        <div
          className="h-3 w-14 rounded-b-full"
          style={{ background: 'linear-gradient(180deg,#D4A94A,#8a6a24)' }}
        />
        <span className="mt-2 font-score text-3xl font-bold tabular-nums text-cream">
          {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
