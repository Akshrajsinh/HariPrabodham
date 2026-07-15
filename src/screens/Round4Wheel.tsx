import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RefreshCcw, Award, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { sfx } from '../utils/sound';

const WHEEL_SIZE = 380;

export default function Round4Wheel() {
  const { bank, r4SelectedTopicId, r4Spinning, spinWheelStart, spinWheelStop, forceStopSpin, goToRound, teams, awardPoints } =
    useGameStore();
  const topics = bank.round4;
  const [rotation, setRotation] = useState(0);
  const spinTimeout = useRef<number | null>(null);
  const { secondsLeft, running, start, pause, reset } = useCountdown(120);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);

  // A fresh page load can never have a real spin animation in flight — if the
  // "spinning" flag is somehow still true (e.g. an old cached build, or a
  // refresh that happened mid-spin before this fix), clear it so the wheel
  // never gets permanently stuck.
  useEffect(() => {
    if (r4Spinning) forceStopSpin();
    return () => {
      if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segAngle = 360 / topics.length;
  const selected = topics.find((t) => t.id === r4SelectedTopicId);
  const isArrival = selected?.isArrivalTopic;

  useEffect(() => {
    setAwardedTeam(null);
  }, [r4SelectedTopicId]);

  const conicGradient = useMemo(() => {
    const stops = topics.map((t, i) => `${t.color ?? '#FF6B1A'} ${i * segAngle}deg ${(i + 1) * segAngle}deg`);
    return `conic-gradient(${stops.join(', ')})`;
  }, [topics, segAngle]);

  const spin = () => {
    if (r4Spinning || topics.length === 0) return;
    sfx.spinStart();
    spinWheelStart();
    const winnerIndex = Math.floor(Math.random() * topics.length);
    // The pointer is at the top (12 o'clock position = -90deg in standard math)
    // For a conic gradient, the segments start at 0deg (3 o'clock) and go clockwise
    // To align a segment with the top pointer, we need it to be at -90deg (or 270deg)
    const targetSegmentCenter = winnerIndex * segAngle + segAngle / 2;
    // We want the center of the winning segment to align with the top pointer
    // Top pointer is at -90deg, so we need: (360 - targetSegmentCenter + offset) % 360 = 90
    // Actually, the rotation is applied clockwise, so to bring a segment to top:
    // The segment at angle θ should be rotated by (270 - θ) degrees to reach top
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    // The current visual angle of the wheel
    const currentVisualAngle = ((rotation % 360) + 360) % 360;
    // We want the target segment center to be at the top (270deg in our rotation space)
    // Because the wheel rotates clockwise, to bring segment at angle θ to top:
    // We need rotation = 270 - θ (plus full spins for momentum)
    const targetRotation = (270 - targetSegmentCenter + 360) % 360;
    let delta = targetRotation - currentVisualAngle;
    if (delta <= 0) delta += 360;
    const finalRotation = rotation + fullSpins * 360 + delta;
    setRotation(finalRotation);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    spinTimeout.current = window.setTimeout(() => {
      sfx.spinStop();
      spinWheelStop(topics[winnerIndex].id);
      reset(120);
    }, 4200);
  };

  useEffect(() => {
    usePresenterActions.getState().register({
      onNext: () => {
        sfx.navigate();
        goToRound('scoreboard');
      },
      onReveal: spin,
      onStartTimer: () => start(),
      onPauseTimer: () => pause(),
    });
    return () => usePresenterActions.getState().clear();
  }, [rotation, r4Spinning, topics]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Round 4 · Spin Wheel Challenge
        <span className="brass-divider w-8" />
      </div>

      <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
        {/* pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '28px solid #D4A94A',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
          }}
        />
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.12, 0.7, 0.25, 1] }}
          className="rounded-full border-[6px] border-brass shadow-glow relative overflow-hidden"
          style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, background: conicGradient }}
        >
          {topics.map((t, i) => {
            const angle = i * segAngle + segAngle / 2;
            return (
              <div
                key={t.id}
                className="absolute left-1/2 top-1/2 origin-left"
                style={{
                  transform: `rotate(${angle}deg) translateX(20px)`,
                  width: WHEEL_SIZE / 2 - 40,
                }}
              >
                <span
                  className="block font-score font-semibold text-white text-xs sm:text-sm drop-shadow-md"
                  style={{ transform: 'translateX(0)' }}
                >
                  {t.label}
                </span>
              </div>
            );
          })}
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-16 w-16 rounded-full glass flex items-center justify-center text-2xl">🪔</div>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={r4Spinning}
        className="btn-primary flex items-center gap-2 text-lg px-8"
      >
        {r4Spinning ? 'Spinning…' : 'Spin the Wheel'}
      </button>

      <AnimatePresence>
        {selected && !r4Spinning && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-lg"
          >
            <GlassCard arch glow="saffron" className="p-8 text-center">
              <p className="text-xs uppercase tracking-widest text-cream/40 mb-2">Selected Topic</p>
              <h2 className="font-display text-3xl text-gradient-saffron font-bold mb-4">{selected.label}</h2>

              {isArrival && (
                <p className="font-body text-cream/80 mb-4">
                  You have 2 minutes to present on this topic.
                </p>
              )}

              <div className="flex flex-col items-center gap-4">
                <DiyaTimer secondsLeft={secondsLeft} totalSeconds={120} running={running} size={140} />
                <div className="flex gap-2">
                  <button onClick={running ? pause : start} className="btn-secondary p-2.5 rounded-xl">
                    {running ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => reset(120)} className="btn-secondary p-2.5 rounded-xl">
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>

              <div className="w-full mt-6">
                <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-2 text-center">
                  Award points to the team that presented well:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        awardPoints(t.id, 'round4', 20);
                        setAwardedTeam(t.id);
                        sfx.correct();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-sm font-score flex items-center gap-1.5 transition-all ${
                        awardedTeam === t.id ? 'bg-emerald/80 text-white' : 'glass text-cream/70 hover:text-cream'
                      }`}
                    >
                      <Award size={14} /> {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  sfx.navigate();
                  goToRound('scoreboard');
                }}
                className="btn-primary mt-6 flex items-center gap-2 mx-auto"
              >
                <Trophy size={18} /> Finish · View Scoreboard
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}