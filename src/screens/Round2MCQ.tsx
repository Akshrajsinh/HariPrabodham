import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, Users, Star, Bell, Award } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import SwaminarayanTilakIcon from '../components/SwaminarayanTilakIcon';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

const letters = ['A', 'B', 'C', 'D'];
const CORRECT_POINTS = 10;
const WRONG_POINTS = -5;
const TIMER_DEFAULT = 60;

function CenterRingTimer({
  secondsLeft,
  totalSeconds,
  running,
  onToggle,
}: {
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
  onToggle: () => void;
}) {
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      onClick={onToggle}
      className="relative flex flex-col items-center justify-center cursor-pointer group mx-auto shrink-0 transition-transform hover:scale-105 my-2"
      style={{ width: 160, height: 160 }}
      title={running ? 'Pause Timer' : 'Start Timer'}
    >
      {/* Outer Golden Glow Aura */}
      <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/35 transition-all" />

      {/* SVG Circular Ring with Ticks & Animated Ring */}
      <svg width={160} height={160} className="-rotate-90 relative z-10">
        {/* Ticking Notch Outer Ring */}
        <circle
          cx={80}
          cy={80}
          r={radius + 6}
          stroke="rgba(212,169,74,0.3)"
          strokeWidth={3}
          strokeDasharray="2 6"
          fill="none"
        />
        {/* Inner Track */}
        <circle
          cx={80}
          cy={80}
          r={radius}
          stroke="rgba(212,169,74,0.15)"
          strokeWidth={8}
          fill="rgba(0,0,0,0.5)"
        />
        {/* Animated Progress Arc */}
        <motion.circle
          cx={80}
          cy={80}
          r={radius}
          stroke={secondsLeft <= 10 ? '#EF4444' : '#FFA733'}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 10px ${secondsLeft <= 10 ? '#EF4444CC' : '#FFA733CC'})` }}
        />
      </svg>

      {/* Center Number & Gujarati "સેકન્ડ" */}
      <div className="absolute z-20 flex flex-col items-center justify-center text-center">
        <span className="font-score text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {secondsLeft}
        </span>
        <span className="text-xs sm:text-sm font-score text-amber-200 font-extrabold tracking-wider mt-0.5">
          સેકન્ડ
        </span>
      </div>
    </div>
  );
}

export default function Round2MCQ() {
  const {
    bank,
    r2Index,
    nextR2,
    prevR2,
    goToRound,
    teams,
    awardPoints,
    markQuestionCompleted,
  } = useGameStore();

  const question = bank.round2[r2Index];
  const { secondsLeft, running, start, pause, reset } = useCountdown(TIMER_DEFAULT);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || null;
  const answered = selectedIndex !== null;

  useEffect(() => {
    reset(TIMER_DEFAULT);
    setActiveTeamId(null);
    setSelectedIndex(null);
  }, [r2Index]);

  const checkAnswer = (i: number) => {
    if (!activeTeamId || answered || !question) return;
    const isCorrect = i === question.correctIndex;
    setSelectedIndex(i);
    awardPoints(activeTeamId, 'round2', isCorrect ? CORRECT_POINTS : WRONG_POINTS);
    markQuestionCompleted('round2', question.id);
    if (isCorrect) {
      sfx.correct();
      fireMarigoldBurst();
    } else {
      sfx.wrong();
    }
  };

  useEffect(() => {
    usePresenterActions.getState().register({
      onNext: () => {
        sfx.navigate();
        if (r2Index >= bank.round2.length - 1) {
          goToRound('scoreboard');
        } else {
          nextR2();
        }
      },
      onPrev: () => {
        sfx.navigate();
        prevR2();
      },
      onStartTimer: () => start(),
      onPauseTimer: () => pause(),
    });
    return () => usePresenterActions.getState().clear();
  }, [r2Index, start, pause, goToRound, nextR2, prevR2, bank.round2.length]);

  if (!question) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-white text-xl font-body font-bold">No questions loaded. Add some via Manage Data on the dashboard.</p>
      </div>
    );
  }

  // Options split into Left (A, C -> indices 0, 2) and Right (B, D -> indices 1, 3)
  const leftOptions = [0, 2];
  const rightOptions = [1, 3];

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between p-3 sm:p-5 gap-3 my-auto max-w-6xl mx-auto">
      {/* Header Bar matching Reference Screenshot */}
      <div className="w-full flex items-center justify-between gap-3 px-1">
        {/* Top-Left Active Team Badge */}
        <div className="flex items-center gap-2.5 bg-black/60 border border-amber-500/50 px-4 py-2 rounded-2xl shadow-lg">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
            <Users size={18} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-score uppercase tracking-widest text-amber-300/70 font-bold">TEAM:</span>
            <span className={`text-sm sm:text-base font-score font-extrabold leading-none ${activeTeam ? 'text-amber-200' : 'text-amber-400 animate-pulse'}`}>
              {activeTeam ? activeTeam.name : 'Select Team...'}
            </span>
          </div>
        </div>

        {/* Top-Center Title */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-score uppercase tracking-[0.2em] text-amber-300 font-extrabold text-center">
          <span className="brass-divider w-6 sm:w-12" />
          <span className="text-amber-400">⚜ 卐</span>
          જ્ઞાન કસોટી - ROUND 2
          <span className="text-amber-400">⚜</span>
          <span className="brass-divider w-6 sm:w-12" />
        </div>

        {/* Top-Right Active Team Score Badge */}
        <div className="flex items-center gap-2.5 bg-black/60 border border-amber-500/50 px-4 py-2 rounded-2xl shadow-lg">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
            <Star size={18} className="fill-amber-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-score uppercase tracking-widest text-amber-300/70 font-bold">SCORE:</span>
            <span className="text-sm sm:text-base font-score font-extrabold text-white leading-none">
              {activeTeam ? activeTeam.totalScore : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Screen Question Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-1 flex flex-col justify-between space-y-4"
        >
          {/* Main Question Card with Swaminarayan Tilak Crest at Top Center */}
          <div className="relative w-full">
            {/* Top Center Swaminarayan Tilak Emblem Badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
              <div className="h-12 w-12 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_20px_rgba(255,167,51,0.9)] flex items-center justify-center p-1">
                <SwaminarayanTilakIcon size={30} />
              </div>
            </div>

            <GlassCard
              arch
              className="p-8 sm:p-10 border-2 border-amber-500/50 shadow-[0_10px_40px_rgba(255,167,51,0.25)] relative overflow-hidden bg-gradient-to-b from-amber-950/40 via-black/80 to-amber-950/60 flex flex-col items-center text-center justify-center min-h-[200px]"
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-relaxed text-white font-extrabold drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-5xl mt-2">
                {question.question}
              </h2>
            </GlassCard>
          </div>

          {/* 3-Column MCQ Layout matching Reference Screenshot */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
            {/* Left Options (A & C) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {leftOptions.map((i) => {
                const opt = question.options[i];
                if (!opt) return null;
                const isCorrect = i === question.correctIndex;
                const isSelected = selectedIndex === i;
                const dim = answered && !isCorrect && !isSelected;
                const showWrongSelected = answered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={i}
                    disabled={!activeTeamId || answered}
                    whileHover={activeTeamId && !answered ? { scale: 1.02, x: 2 } : {}}
                    animate={answered && isCorrect ? { scale: [1, 1.03, 1], transition: { duration: 0.5 } } : {}}
                    onClick={() => checkAnswer(i)}
                    className={`rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-left transition-all duration-300 border-2 ${
                      dim ? 'opacity-30 glass border-white/10' : ''
                    } ${
                      !activeTeamId && !answered ? 'cursor-not-allowed opacity-50 border-amber-500/20' : ''
                    } ${
                      activeTeamId && !answered
                        ? 'bg-gradient-to-b from-black/80 via-black/60 to-amber-950/40 border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(255,167,51,0.4)]'
                        : ''
                    } ${
                      answered && isCorrect
                        ? 'bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-emerald-900/90 border-2 border-emerald-300 shadow-[0_0_45px_rgba(16,185,129,0.9)]'
                        : ''
                    } ${
                      showWrongSelected
                        ? 'bg-gradient-to-r from-red-900/90 via-red-800/80 to-red-900/90 border-2 border-red-300 shadow-[0_0_45px_rgba(239,68,68,0.9)]'
                        : ''
                    }`}
                  >
                    {/* Metallic Gold Circular Letter Badge */}
                    <span
                      className={`font-score font-extrabold text-lg sm:text-xl h-11 w-11 flex items-center justify-center rounded-full shrink-0 shadow-md border-2 ${
                        answered && isCorrect
                          ? 'bg-emerald-500 border-white text-white'
                          : showWrongSelected
                          ? 'bg-red-500 border-white text-white'
                          : 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-white text-slate-950'
                      }`}
                    >
                      {letters[i]}
                    </span>

                    <span className="font-body text-lg sm:text-2xl text-white font-bold leading-snug flex-1">
                      {opt}
                    </span>

                    {answered && isCorrect && <CheckCircle2 className="text-emerald-300 shrink-0" size={26} />}
                    {showWrongSelected && <XCircle className="text-red-300 shrink-0" size={26} />}
                  </motion.button>
                );
              })}
            </div>

            {/* Center Circular Timer Ring */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <CenterRingTimer
                secondsLeft={secondsLeft}
                totalSeconds={TIMER_DEFAULT}
                running={running}
                onToggle={() => (running ? pause() : start())}
              />
            </div>

            {/* Right Options (B & D) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {rightOptions.map((i) => {
                const opt = question.options[i];
                if (!opt) return null;
                const isCorrect = i === question.correctIndex;
                const isSelected = selectedIndex === i;
                const dim = answered && !isCorrect && !isSelected;
                const showWrongSelected = answered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={i}
                    disabled={!activeTeamId || answered}
                    whileHover={activeTeamId && !answered ? { scale: 1.02, x: -2 } : {}}
                    animate={answered && isCorrect ? { scale: [1, 1.03, 1], transition: { duration: 0.5 } } : {}}
                    onClick={() => checkAnswer(i)}
                    className={`rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-left transition-all duration-300 border-2 ${
                      dim ? 'opacity-30 glass border-white/10' : ''
                    } ${
                      !activeTeamId && !answered ? 'cursor-not-allowed opacity-50 border-amber-500/20' : ''
                    } ${
                      activeTeamId && !answered
                        ? 'bg-gradient-to-b from-black/80 via-black/60 to-amber-950/40 border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(255,167,51,0.4)]'
                        : ''
                    } ${
                      answered && isCorrect
                        ? 'bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-emerald-900/90 border-2 border-emerald-300 shadow-[0_0_45px_rgba(16,185,129,0.9)]'
                        : ''
                    } ${
                      showWrongSelected
                        ? 'bg-gradient-to-r from-red-900/90 via-red-800/80 to-red-900/90 border-2 border-red-300 shadow-[0_0_45px_rgba(239,68,68,0.9)]'
                        : ''
                    }`}
                  >
                    {/* Metallic Gold Circular Letter Badge */}
                    <span
                      className={`font-score font-extrabold text-lg sm:text-xl h-11 w-11 flex items-center justify-center rounded-full shrink-0 shadow-md border-2 ${
                        answered && isCorrect
                          ? 'bg-emerald-500 border-white text-white'
                          : showWrongSelected
                          ? 'bg-red-500 border-white text-white'
                          : 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-white text-slate-950'
                      }`}
                    >
                      {letters[i]}
                    </span>

                    <span className="font-body text-lg sm:text-2xl text-white font-bold leading-snug flex-1">
                      {opt}
                    </span>

                    {answered && isCorrect && <CheckCircle2 className="text-emerald-300 shrink-0" size={26} />}
                    {showWrongSelected && <XCircle className="text-red-300 shrink-0" size={26} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bottom Footer Rule matching Reference Screenshot */}
          <div className="w-full flex items-center justify-center gap-3 text-xs sm:text-sm font-score text-amber-300/90 font-extrabold text-center pt-2">
            <span className="brass-divider w-12 sm:w-24" />
            <Bell size={15} className="text-amber-400 shrink-0" />
            <span>દરેક સાચા જવાબના {CORRECT_POINTS} ગુણ</span>
            <Bell size={15} className="text-amber-400 shrink-0" />
            <span className="brass-divider w-12 sm:w-24" />
          </div>

          {/* Presenter Team Switcher */}
          <div className="flex flex-col justify-center items-center gap-1.5 pt-2">
            <span className={`text-xs font-score uppercase tracking-[0.2em] font-extrabold flex items-center gap-1.5 ${!activeTeamId ? 'text-amber-400 animate-bounce' : 'text-amber-300/90'}`}>
              {!activeTeamId ? '👇 Step 1 · Select the team answering before tapping options:' : '✓ Team Selected — Tap option above to submit answer:'}
            </span>
            <div className="flex flex-wrap justify-center gap-2.5">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    sfx.click();
                    setActiveTeamId(t.id);
                  }}
                  className={`px-4.5 py-2 rounded-xl text-xs sm:text-sm font-score font-extrabold flex items-center gap-1.5 transition-all ${
                    activeTeamId === t.id
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(255,167,51,0.9)] border-2 border-white scale-105 font-black'
                      : 'glass text-white hover:text-white border border-amber-500/30'
                  }`}
                >
                  <Award size={15} className={activeTeamId === t.id ? 'text-slate-950' : 'text-amber-300'} /> {t.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation Control Bar */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => {
            sfx.navigate();
            prevR2();
          }}
          disabled={r2Index === 0}
          className="btn-secondary text-sm px-7 py-2.5 flex items-center gap-2 border-2 border-white/30 hover:border-amber-300"
        >
          <ChevronLeft size={20} /> Previous Question
        </button>

        {r2Index >= bank.round2.length - 1 ? (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary text-sm px-8 py-2.5 flex items-center gap-2 shadow-[0_0_40px_rgba(255,107,26,0.8)] font-extrabold"
          >
            <Trophy size={20} /> Finish Round 2 · View Scoreboard
          </button>
        ) : (
          <button
            onClick={() => {
              sfx.navigate();
              nextR2();
            }}
            className="btn-primary text-sm px-8 py-2.5 flex items-center gap-2 shadow-[0_0_40px_rgba(255,107,26,0.8)] font-extrabold"
          >
            Next Question <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
