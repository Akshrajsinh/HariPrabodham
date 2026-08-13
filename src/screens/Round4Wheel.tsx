import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RefreshCcw, Award, Trophy, CheckCircle } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { sfx } from '../utils/sound';

const WHEEL_SIZE = 340;

export default function Round4Wheel() {
  const {
    bank,
    r4SelectedTopicId,
    r4Spinning,
    spinWheelStart,
    spinWheelStop,
    forceStopSpin,
    goToRound,
    teams,
    awardPoints,
    removeRound4Topic,
    markQuestionCompleted,
  } = useGameStore();

  const topics = bank.round4;
  const [rotation, setRotation] = useState(0);
  const spinTimeout = useRef<number | null>(null);
  const { secondsLeft, running, start, pause, reset } = useCountdown(120);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  useEffect(() => {
    if (r4Spinning) forceStopSpin();
    return () => {
      if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const segAngle = 360 / (topics.length || 1);
  const selected = topics.find((t) => t.id === r4SelectedTopicId);
  const isArrival = selected?.isArrivalTopic;

  useEffect(() => {
    setAwardedTeam(null);
  }, [r4SelectedTopicId]);

  const conicGradient = useMemo(() => {
    if (topics.length === 0) return 'none';
    const stops = topics.map((t, i) => `${t.color ?? '#FF6B1A'} ${i * segAngle}deg ${(i + 1) * segAngle}deg`);
    return `conic-gradient(${stops.join(', ')})`;
  }, [topics, segAngle]);

  const spin = () => {
    if (r4Spinning || topics.length === 0) return;

    sfx.spinStart();
    spinWheelStart();
    const winnerIndex = Math.floor(Math.random() * topics.length);
    const targetSegmentCenter = winnerIndex * segAngle + segAngle / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const currentVisualAngle = ((rotation % 360) + 360) % 360;
    const desiredVisualAngle = (360 - targetSegmentCenter) % 360;
    let delta = desiredVisualAngle - currentVisualAngle;
    if (delta <= 0) delta += 360;
    const finalRotation = rotation + fullSpins * 360 + delta;
    setRotation(finalRotation);

    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    spinTimeout.current = window.setTimeout(() => {
      sfx.spinStop();
      const selectedTopic = topics[winnerIndex];
      spinWheelStop(selectedTopic.id);
      markQuestionCompleted('round4', selectedTopic.id);
      reset(120);

      if (selectedTopic.isArrivalTopic) {
        removeRound4Topic(selectedTopic.id);
        setCompletedTopics((prev) => [...prev, selectedTopic.id]);
      }
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
  }, [rotation, r4Spinning, topics, spin, start, pause, goToRound]);

  if (topics.length === 0 && completedTopics.length > 0) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 my-auto gap-6">
        <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
          <span className="brass-divider w-8" />
          Round 4 · Complete!
          <span className="brass-divider w-8" />
        </div>

        <GlassCard arch glow="saffron" className="p-8 text-center max-w-lg">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-emerald/20 flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald" />
            </div>
          </div>
          <h2 className="font-display text-3xl text-gradient-saffron font-bold mb-3">
            All Topics Completed! 🎉
          </h2>
          <p className="text-cream/70 mb-2">
            You've successfully completed all {completedTopics.length} Round 4 topics!
          </p>
          <p className="text-cream/50 text-sm mb-6">Great job presenting all the arrival topics.</p>
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Trophy size={18} /> View Final Scoreboard
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 gap-4 my-auto max-w-7xl mx-auto">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Round 4 · Spin Wheel Challenge
        <span className="brass-divider w-8" />
      </div>

      <div className="text-sm font-score text-cream/60 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald inline-block" />
        {topics.length} topic{topics.length !== 1 ? 's' : ''} remaining · {completedTopics.length} completed ✓
      </div>

      <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
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
        disabled={r4Spinning || topics.length === 0}
        className="btn-primary flex items-center gap-2 text-lg px-8"
      >
        {r4Spinning ? 'Spinning…' : topics.length === 0 ? 'All Done!' : 'Spin the Wheel'}
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

              {isArrival && <p className="font-body text-cream/80 mb-4">You have 2 minutes to present on this topic.</p>}

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
                        if (selected) markQuestionCompleted('round4', selected.id);
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

              <div className="flex gap-3 mt-6 justify-center">
                <button
                  onClick={() => {
                    sfx.navigate();
                    spin();
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCcw size={16} /> Spin Again
                </button>
                <button
                  onClick={() => {
                    sfx.navigate();
                    goToRound('scoreboard');
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Trophy size={18} /> View Scoreboard
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



