import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RefreshCcw, Award, Trophy, CheckCircle, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { sfx } from '../utils/sound';

const WHEEL_SIZE = 380;
const SLICE_COLORS = [
  '#FF6B1A', // Saffron
  '#FFA733', // Warm Gold
  '#E84E00', // Crimson Saffron
  '#F3C34F', // Brass Gold
  '#10B981', // Emerald Green
  '#8B5CF6', // Royal Violet
  '#EC4899', // Bright Pink
  '#3B82F6', // Vibrant Blue
];

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Render High-DPI Canvas Wheel Slices & Upright Legible Topic Labels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || topics.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = WHEEL_SIZE;
    const scale = window.devicePixelRatio || 2;
    canvas.width = size * scale;
    canvas.height = size * scale;
    ctx.scale(scale, scale);

    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;
    const numTopics = topics.length;
    const segAngleRad = (2 * Math.PI) / numTopics;

    ctx.clearRect(0, 0, size, size);

    // Draw Slices
    topics.forEach((t, i) => {
      const startAngle = i * segAngleRad;
      const endAngle = (i + 1) * segAngleRad;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = t.color || SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fill();

      // Divider Line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // Draw Outer Golden Border Ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#F3C34F';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Draw Radial Upright Legible Topic Labels
    topics.forEach((t, i) => {
      const midAngle = i * segAngleRad + segAngleRad / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      const normalizedAngle = (midAngle + 2 * Math.PI) % (2 * Math.PI);
      const isBottomHalf = normalizedAngle > Math.PI / 2 && normalizedAngle < (3 * Math.PI) / 2;

      const maxChars = numTopics > 6 ? 16 : 22;
      const label = t.label.length > maxChars ? t.label.slice(0, maxChars - 2) + '…' : t.label;

      if (isBottomHalf) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Poppins, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 5;
        ctx.fillText(label, -radius + 18, 4);
      } else {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Poppins, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 5;
        ctx.fillText(label, radius - 18, 4);
      }

      ctx.restore();
    });
  }, [topics]);

  const spin = () => {
    if (r4Spinning || topics.length === 0) return;

    sfx.spinStart();
    spinWheelStart();
    const winnerIndex = Math.floor(Math.random() * topics.length);
    const targetSegmentCenter = winnerIndex * segAngle + segAngle / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const currentVisualAngle = ((rotation % 360) + 360) % 360;
    const POINTER_ANGLE = 270; // 12 o'clock top pointer position
    const desiredVisualAngle = (POINTER_ANGLE - targetSegmentCenter + 360) % 360;
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
    <div className="flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 gap-4 my-auto max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="w-full flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3 text-sm font-score uppercase tracking-[0.25em] text-marigold font-extrabold mx-auto">
          <span className="brass-divider w-12" />
          <Sparkles size={18} className="text-marigold fill-marigold" />
          જ્ઞાન કસોટી · Round 4 Spin Wheel
          <Sparkles size={18} className="text-marigold fill-marigold" />
          <span className="brass-divider w-12" />
        </div>
      </div>

      <div className="text-sm font-score text-cream/70 flex items-center gap-2 font-bold">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
        {topics.length} topic{topics.length !== 1 ? 's' : ''} remaining · {completedTopics.length} completed ✓
      </div>

      {/* Spin Wheel Shrine */}
      <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
        {/* Top Gold Pointer Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-4 z-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: '18px solid transparent',
            borderRight: '18px solid transparent',
            borderTop: '32px solid #FFA733',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
          }}
        />

        {/* Rotatable High-DPI Canvas Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.12, 0.7, 0.25, 1] }}
          className="rounded-full shadow-[0_0_50px_rgba(255,167,51,0.5)] overflow-hidden"
          style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
            className="w-full h-full block"
          />
        </motion.div>

        {/* Center Diya Emblem Cap */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="h-16 w-16 rounded-full glass border-2 border-amber-300 shadow-lg flex items-center justify-center text-2xl">
            🪔
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={spin}
        disabled={r4Spinning || topics.length === 0}
        className="btn-primary flex items-center gap-2 text-lg px-9 py-3.5 shadow-[0_0_35px_rgba(255,107,26,0.8)] font-extrabold"
      >
        {r4Spinning ? 'Spinning…' : topics.length === 0 ? 'All Done!' : 'Spin the Wheel'}
      </button>

      {/* Selected Topic Presentation Card */}
      <AnimatePresence>
        {selected && !r4Spinning && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-xl"
          >
            <GlassCard arch glow="saffron" className="p-7 text-center border-2 border-saffron-400/50 bg-gradient-to-b from-white/[0.2] via-white/[0.1] to-saffron-950/60 shadow-[0_12px_45px_rgba(255,107,26,0.3)]">
              <p className="text-xs uppercase tracking-widest text-marigold font-extrabold mb-1">Selected Topic</p>
              <h2 className="font-display text-3xl sm:text-4xl text-gradient-gold font-extrabold mb-3">{selected.label}</h2>

              {isArrival && <p className="font-body text-white/90 text-sm mb-4">You have 2 minutes to present on this topic.</p>}

              <div className="flex flex-col items-center gap-3">
                <DiyaTimer secondsLeft={secondsLeft} totalSeconds={120} running={running} size={130} />
                <div className="flex gap-2">
                  <button onClick={running ? pause : start} className="btn-secondary p-2.5 rounded-xl border border-white/30">
                    {running ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => reset(120)} className="btn-secondary p-2.5 rounded-xl border border-white/30">
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>

              <div className="w-full mt-5">
                <p className="text-xs font-score uppercase tracking-widest text-marigold mb-2 text-center font-extrabold">
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
                      className={`px-4 py-2 rounded-xl text-xs font-score font-extrabold flex items-center gap-1.5 transition-all ${
                        awardedTeam === t.id
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white border-2 border-white scale-105 shadow-md'
                          : 'glass text-white hover:text-white hover:border-saffron-300'
                      }`}
                    >
                      <Award size={14} className={awardedTeam === t.id ? 'text-white' : 'text-marigold'} /> {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-5 justify-center">
                <button
                  onClick={() => {
                    sfx.navigate();
                    spin();
                  }}
                  className="btn-secondary flex items-center gap-2 text-xs px-5 py-2.5 border-2 border-white/30"
                >
                  <RefreshCcw size={16} /> Spin Again
                </button>
                <button
                  onClick={() => {
                    sfx.navigate();
                    goToRound('scoreboard');
                  }}
                  className="btn-primary flex items-center gap-2 text-xs px-6 py-2.5 font-extrabold shadow-[0_0_30px_rgba(255,107,26,0.8)]"
                >
                  <Trophy size={16} /> View Scoreboard
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
