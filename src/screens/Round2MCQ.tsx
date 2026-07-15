import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, RefreshCcw, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

const letters = ['A', 'B', 'C', 'D'];
const CORRECT_POINTS = 10;
const WRONG_POINTS = 0;

export default function Round2MCQ() {
  const { bank, r2Index, r2TimerDuration, nextR2, prevR2, setR2TimerDuration, goToRound, teams, awardPoints } =
    useGameStore();
  const question = bank.round2[r2Index];
  const { secondsLeft, running, start, pause, reset } = useCountdown(r2TimerDuration);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);

  const answered = selectedIndex !== null;

  useEffect(() => {
    reset(r2TimerDuration);
    setActiveTeamId(null);
    setSelectedIndex(null);
    setAwardedTeam(null);
  }, [r2Index, r2TimerDuration]);

  const checkAnswer = (i: number) => {
    if (!activeTeamId || answered || !question) return;
    const isCorrect = i === question.correctIndex;
    setSelectedIndex(i);
    awardPoints(activeTeamId, 'round2', isCorrect ? CORRECT_POINTS : WRONG_POINTS);
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
      onStartTimer: () => {
        sfx.click();
        start();
      },
      onPauseTimer: () => {
        sfx.click();
        pause();
      },
    });
    return () => usePresenterActions.getState().clear();
  }, [r2Index]);

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cream/60 font-body">No questions loaded. Add some via Manage Data on the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Round 2 · Multiple Choice Challenge
        <span className="brass-divider w-8" />
        <span className="text-cream/40">
          Q{r2Index + 1} / {bank.round2.length}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 w-full max-w-6xl">
        <div className="flex flex-col items-center gap-4">
          <DiyaTimer secondsLeft={secondsLeft} totalSeconds={r2TimerDuration} running={running} size={160} />
          <div className="flex gap-2">
            {[30, 45, 60].map((d) => (
              <button
                key={d}
                onClick={() => setR2TimerDuration(d as 30 | 45 | 60)}
                className={`px-2.5 py-1 rounded-lg text-xs font-score ${
                  r2TimerDuration === d ? 'bg-saffron-500 text-white' : 'glass text-cream/50'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={running ? pause : start} className="btn-secondary p-2.5 rounded-xl">
              {running ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => reset(r2TimerDuration)} className="btn-secondary p-2.5 rounded-xl">
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 40, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard arch className="p-8 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {question.category && (
                    <span className="text-xs font-score px-2.5 py-1 rounded-full bg-white/10 text-marigold">
                      {question.category}
                    </span>
                  )}
                  {question.difficulty && (
                    <span className="text-xs font-score px-2.5 py-1 rounded-full bg-white/5 text-cream/50 capitalize">
                      {question.difficulty}
                    </span>
                  )}
                  <span className="text-xs font-score px-2.5 py-1 rounded-full bg-emerald/10 text-emerald">
                    Correct +{CORRECT_POINTS} · Wrong +{WRONG_POINTS}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl leading-snug text-cream">{question.question}</h2>
              </GlassCard>

              {/* Step 1 — pick the team answering */}
              <div className="mb-4">
                <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-2">
                  Step 1 · Which team is answering?
                </p>
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      disabled={answered}
                      onClick={() => {
                        sfx.click();
                        setActiveTeamId(t.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-sm font-score transition-all disabled:opacity-40 ${
                        activeTeamId === t.id ? 'bg-saffron-600 text-white shadow-glow' : 'glass text-cream/70 hover:text-cream'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-2">
                Step 2 · Tap the option they answered
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.options.map((opt, i) => {
                  const isCorrect = i === question.correctIndex;
                  const isSelected = selectedIndex === i;
                  const dim = answered && !isCorrect && !isSelected;
                  const showWrongSelected = answered && isSelected && !isCorrect;
                  return (
                    <motion.button
                      key={i}
                      disabled={!activeTeamId || answered}
                      whileHover={!answered && activeTeamId ? { scale: 1.03, y: -3 } : {}}
                      animate={answered && isCorrect ? { scale: [1, 1.04, 1], transition: { duration: 0.6 } } : {}}
                      onClick={() => checkAnswer(i)}
                      className={`glass rounded-2xl p-5 flex items-center gap-4 text-left transition-opacity duration-500 ${
                        dim ? 'opacity-30' : 'opacity-100'
                      } ${answered && isCorrect ? 'shadow-glow-green border-emerald/50' : ''} ${
                        showWrongSelected ? 'shadow-glow-red border-kumkum/50' : ''
                      } ${!activeTeamId && !answered ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span
                        className={`font-score font-bold text-lg h-9 w-9 flex items-center justify-center rounded-full shrink-0 ${
                          answered && isCorrect
                            ? 'bg-emerald text-white'
                            : showWrongSelected
                            ? 'bg-kumkum text-white'
                            : 'bg-white/10 text-cream/70'
                        }`}
                      >
                        {letters[i]}
                      </span>
                      <span className="font-body text-lg text-cream/90 flex-1">{opt}</span>
                      {answered && isCorrect && <CheckCircle2 className="text-emerald shrink-0" size={22} />}
                      {showWrongSelected && <XCircle className="text-kumkum shrink-0" size={22} />}
                    </motion.button>
                  );
                })}
              </div>

              {answered && question.explanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <GlassCard className="p-4">
                    <p className="text-sm text-cream/70 font-body">
                      <span className="text-marigold font-semibold">Explanation: </span>
                      {question.explanation}
                    </p>
                  </GlassCard>
                </motion.div>
              )}

              {answered && awardedTeam && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm font-score text-center"
                >
                  {selectedIndex === question.correctIndex ? (
                    <span className="text-emerald">
                      {teams.find((t) => t.id === awardedTeam)?.name} answered correctly · +{CORRECT_POINTS} points
                    </span>
                  ) : (
                    <span className="text-kumkum">
                      {teams.find((t) => t.id === awardedTeam)?.name} answered incorrectly · +{WRONG_POINTS} points
                    </span>
                  )}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            sfx.navigate();
            prevR2();
          }}
          disabled={r2Index === 0}
          className="btn-secondary flex items-center gap-1.5"
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <button
          onClick={() => {
            sfx.navigate();
            nextR2();
          }}
          disabled={r2Index >= bank.round2.length - 1}
          className="btn-primary flex items-center gap-1.5"
        >
          Next Question <ChevronRight size={18} />
        </button>
        {r2Index >= bank.round2.length - 1 && (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary flex items-center gap-1.5"
          >
            <Trophy size={18} /> Finish Round · View Scoreboard
          </button>
        )}
      </div>
    </div>
  );
}
