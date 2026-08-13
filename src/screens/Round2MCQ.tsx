import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, Sparkles, Award } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import GlassCard from '../components/GlassCard';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

const letters = ['A', 'B', 'C', 'D'];
const CORRECT_POINTS = 10;
const WRONG_POINTS = -5;

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
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);

  const answered = selectedIndex !== null;

  useEffect(() => {
    setActiveTeamId(null);
    setSelectedIndex(null);
    setAwardedTeam(null);
  }, [r2Index]);

  const checkAnswer = (i: number) => {
    if (!activeTeamId || answered || !question) return;
    const isCorrect = i === question.correctIndex;
    setSelectedIndex(i);
    awardPoints(activeTeamId, 'round2', isCorrect ? CORRECT_POINTS : WRONG_POINTS);
    markQuestionCompleted('round2', question.id);
    setAwardedTeam(activeTeamId);
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
    });
    return () => usePresenterActions.getState().clear();
  }, [r2Index]);

  if (!question) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-white text-xl font-body font-bold">No questions loaded. Add some via Manage Data on the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 gap-4 my-auto max-w-6xl mx-auto">
      {/* Top Header Banner */}
      <div className="w-full flex items-center justify-center px-2">
        <div className="flex items-center gap-3 text-sm font-score uppercase tracking-[0.25em] text-marigold font-extrabold text-center">
          <span className="brass-divider w-12 sm:w-16" />
          <Sparkles size={18} className="text-marigold fill-marigold shrink-0" />
          જ્ઞાન કસોટી · Round 2 Multiple Choice
          <Sparkles size={18} className="text-marigold fill-marigold shrink-0" />
          <span className="brass-divider w-12 sm:w-16" />
        </div>
      </div>

      {/* Main Full-Screen Question Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-1 flex flex-col justify-between space-y-4"
        >
          {/* Main Question Temple Arch Card */}
          <GlassCard
            arch
            className="p-8 sm:p-10 border-2 border-saffron-400/50 shadow-[0_12px_45px_rgba(255,107,26,0.3)] relative overflow-hidden bg-gradient-to-b from-white/[0.2] via-white/[0.1] to-saffron-950/60 flex flex-col items-center text-center justify-center gap-6 min-h-[220px]"
          >

            {/* Category & Points Badges */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {question.category && (
                <span className="text-xs font-score font-extrabold px-3.5 py-1 rounded-full bg-saffron-500/30 border-2 border-saffron-300 text-amber-200 shadow-sm">
                  ✨ {question.category}
                </span>
              )}
              <span className="text-xs font-score font-extrabold px-3.5 py-1 rounded-full bg-emerald-500/25 border-2 border-emerald-400 text-emerald-300">
                Correct +{CORRECT_POINTS} · Wrong {WRONG_POINTS}
              </span>
            </div>

            {/* Prominent High-Contrast Gujarati Question Title */}
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-relaxed text-white font-extrabold drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-5xl">
              {question.question}
            </h2>
          </GlassCard>

          {/* Step 1 — Team Selection Pills */}
          <div className="glass p-4 rounded-2xl border-2 border-saffron-400/40 bg-saffron-950/40">
            <p className="text-xs font-score uppercase tracking-[0.2em] text-marigold mb-2 flex items-center justify-center gap-1.5 font-extrabold">
              <span>★</span> Step 1 · Select the team answering:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {teams.map((t) => (
                <button
                  key={t.id}
                  disabled={answered}
                  onClick={() => {
                    sfx.click();
                    setActiveTeamId(t.id);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-score font-extrabold transition-all duration-200 disabled:opacity-40 flex items-center gap-2 ${
                    activeTeamId === t.id
                      ? 'bg-gradient-to-r from-saffron-400 via-marigold to-saffron-500 text-slate-950 shadow-[0_0_30px_rgba(255,167,51,0.9)] border-2 border-white scale-105'
                      : 'glass text-white hover:text-white hover:border-saffron-300'
                  }`}
                >
                  <Award size={18} className={activeTeamId === t.id ? 'text-slate-950' : 'text-marigold'} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Full Screen 2x2 MCQ Option Cards Grid */}
          <div>
            <p className="text-xs font-score uppercase tracking-[0.2em] text-marigold mb-2.5 flex items-center justify-center gap-1.5 font-extrabold">
              <span>★</span> Step 2 · Tap the option they answered:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {question.options.map((opt, i) => {
                const isCorrect = i === question.correctIndex;
                const isSelected = selectedIndex === i;
                const dim = answered && !isCorrect && !isSelected;
                const showWrongSelected = answered && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={i}
                    disabled={!activeTeamId || answered}
                    whileHover={!answered && activeTeamId ? { scale: 1.02, y: -2 } : {}}
                    animate={answered && isCorrect ? { scale: [1, 1.03, 1], transition: { duration: 0.5 } } : {}}
                    onClick={() => checkAnswer(i)}
                    className={`rounded-2xl p-5 sm:p-6 flex items-center gap-5 text-left transition-all duration-300 border-2 ${
                      dim ? 'opacity-30 glass border-white/10' : ''
                    } ${
                      !answered
                        ? 'bg-gradient-to-b from-white/[0.18] via-white/[0.08] to-black/60 border-white/30 hover:border-saffron-300 hover:bg-saffron-400/25 hover:shadow-[0_0_40px_rgba(255,167,51,0.5)]'
                        : ''
                    } ${
                      answered && isCorrect
                        ? 'bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-emerald-900/90 border-2 border-emerald-300 shadow-[0_0_55px_rgba(16,185,129,0.9)]'
                        : ''
                    } ${
                      showWrongSelected
                        ? 'bg-gradient-to-r from-red-900/90 via-red-800/80 to-red-900/90 border-2 border-red-300 shadow-[0_0_55px_rgba(239,68,68,0.9)]'
                        : ''
                    } ${!activeTeamId && !answered ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {/* Metallic Saffron/Gold Letter Badge */}
                    <span
                      className={`font-score font-extrabold text-xl h-12 w-12 flex items-center justify-center rounded-full shrink-0 shadow-lg border-2 ${
                        answered && isCorrect
                          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-white text-white shadow-[0_0_20px_rgba(16,185,129,0.9)]'
                          : showWrongSelected
                          ? 'bg-gradient-to-br from-red-500 to-rose-700 border-white text-white shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                          : 'bg-gradient-to-br from-saffron-300 via-marigold to-saffron-500 border-white text-slate-950'
                      }`}
                    >
                      {letters[i]}
                    </span>

                    <div className="flex-1 min-w-0">
                      <span className="font-body text-xl sm:text-2xl text-white font-bold leading-relaxed block drop-shadow-sm">
                        {opt}
                      </span>
                      {answered && isCorrect && (
                        <span className="text-sm font-score text-emerald-300 font-extrabold mt-1 inline-block">
                          ✓ જવાબ સાચો છે! (Correct Answer)
                        </span>
                      )}
                      {showWrongSelected && (
                        <span className="text-sm font-score text-red-300 font-extrabold mt-1 inline-block">
                          ✗ જવાબ ખોટો છે! (Incorrect)
                        </span>
                      )}
                    </div>

                    {answered && isCorrect && <CheckCircle2 className="text-emerald-300 shrink-0" size={30} />}
                    {showWrongSelected && <XCircle className="text-red-300 shrink-0" size={30} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {answered && question.explanation && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <GlassCard className="p-4 border-2 border-saffron-400/40 bg-saffron-500/15">
                <p className="text-base text-white font-body leading-relaxed font-medium">
                  <span className="text-marigold font-extrabold">Explanation: </span>
                  {question.explanation}
                </p>
              </GlassCard>
            </motion.div>
          )}

          {answered && awardedTeam && (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-base sm:text-lg font-score text-center p-3 rounded-xl glass border-2 border-white/20 font-bold"
            >
              {selectedIndex === question.correctIndex ? (
                <span className="text-emerald-300 font-extrabold flex items-center justify-center gap-2">
                  <Sparkles size={20} className="fill-emerald-300" />
                  {teams.find((t) => t.id === awardedTeam)?.name} answered correctly! +{CORRECT_POINTS} points awarded 🎉
                </span>
              ) : (
                <span className="text-red-300 font-extrabold">
                  {teams.find((t) => t.id === awardedTeam)?.name} answered incorrectly ({WRONG_POINTS} points)
                </span>
              )}
            </motion.p>
          )}
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
          className="btn-secondary text-sm px-7 py-3.5 flex items-center gap-2 border-2 border-white/30 hover:border-saffron-300"
        >
          <ChevronLeft size={20} /> Previous Question
        </button>

        {r2Index >= bank.round2.length - 1 ? (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary text-sm px-8 py-3.5 flex items-center gap-2 shadow-[0_0_40px_rgba(255,107,26,0.8)] font-extrabold"
          >
            <Trophy size={20} /> Finish Round 2 · View Scoreboard
          </button>
        ) : (
          <button
            onClick={() => {
              sfx.navigate();
              nextR2();
            }}
            className="btn-primary text-sm px-8 py-3.5 flex items-center gap-2 shadow-[0_0_40px_rgba(255,107,26,0.8)] font-extrabold"
          >
            Next Question <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
