import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, RefreshCcw, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import QuestionStepperBar from '../components/QuestionStepperBar';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

const letters = ['A', 'B', 'C', 'D'];
const CORRECT_POINTS = 10;
const WRONG_POINTS = 0;

export default function Round2MCQ() {
  const {
    bank,
    r2Index,
    r2TimerDuration,
    nextR2,
    prevR2,
    goToR2,
    setR2TimerDuration,
    goToRound,
    teams,
    awardPoints,
    markQuestionCompleted,
  } = useGameStore();

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
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-cream/60 font-body">No questions loaded. Add some via Manage Data on the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 gap-3 my-auto max-w-7xl mx-auto">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Round 2 · Multiple Choice Challenge
        <span className="brass-divider w-8" />
      </div>

      {/* Check Mark Navigation Stepper */}
      <QuestionStepperBar
        round="round2"
        currentIndex={r2Index}
        totalQuestions={bank.round2.length}
        onSelectIndex={(i) => goToR2(i)}
        questionIds={bank.round2.map((q) => q.id)}
      />

      <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 w-full flex-1 my-1">
        {/* Left Timer Sidebar */}
        <div className="flex flex-row lg:flex-col items-center justify-center gap-4 glass p-5 rounded-3xl shrink-0">
          <DiyaTimer secondsLeft={secondsLeft} totalSeconds={r2TimerDuration} running={running} size={130} />
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-1.5">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setR2TimerDuration(d as 30 | 45 | 60)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-score transition-colors ${
                    r2TimerDuration === d ? 'bg-saffron-500 text-white font-bold' : 'glass text-cream/50 hover:text-cream'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={running ? pause : start} className="btn-secondary p-2 rounded-xl" title="Play/Pause">
                {running ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={() => reset(r2TimerDuration)} className="btn-secondary p-2 rounded-xl" title="Reset Timer">
                <RefreshCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Question Area */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between space-y-4"
            >
              <GlassCard arch className="p-5 sm:p-6 shadow-glow">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {question.category && (
                    <span className="text-xs font-score px-2.5 py-0.5 rounded-full bg-white/10 text-marigold">
                      {question.category}
                    </span>
                  )}
                  {question.difficulty && (
                    <span className="text-xs font-score px-2.5 py-0.5 rounded-full bg-white/5 text-cream/50 capitalize">
                      {question.difficulty}
                    </span>
                  )}
                  <span className="text-xs font-score px-2.5 py-0.5 rounded-full bg-emerald/10 text-emerald">
                    Correct +{CORRECT_POINTS} · Wrong +{WRONG_POINTS}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl lg:text-3xl leading-snug text-cream">{question.question}</h2>
              </GlassCard>

              {/* Step 1 — pick the team answering */}
              <div>
                <p className="text-[11px] font-score uppercase tracking-widest text-cream/40 mb-1.5">
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-score transition-all disabled:opacity-40 ${
                        activeTeamId === t.id ? 'bg-saffron-600 text-white shadow-glow' : 'glass text-cream/70 hover:text-cream'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 — option grid */}
              <div>
                <p className="text-[11px] font-score uppercase tracking-widest text-cream/40 mb-1.5">
                  Step 2 · Tap the option they answered
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                        className={`glass rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 text-left transition-opacity duration-300 ${
                          dim ? 'opacity-30' : 'opacity-100'
                        } ${answered && isCorrect ? 'shadow-glow-green border-emerald/60 bg-emerald/10' : ''} ${
                          showWrongSelected ? 'shadow-glow-red border-kumkum/60 bg-kumkum/10' : ''
                        } ${!activeTeamId && !answered ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <span
                          className={`font-score font-bold text-base h-8 w-8 flex items-center justify-center rounded-full shrink-0 ${
                            answered && isCorrect
                              ? 'bg-emerald text-white'
                              : showWrongSelected
                              ? 'bg-kumkum text-white'
                              : 'bg-white/10 text-cream/70'
                          }`}
                        >
                          {letters[i]}
                        </span>
                        <span className="font-body text-base sm:text-lg text-cream/90 flex-1 leading-snug">{opt}</span>
                        {answered && isCorrect && <CheckCircle2 className="text-emerald shrink-0" size={20} />}
                        {showWrongSelected && <XCircle className="text-kumkum shrink-0" size={20} />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {answered && question.explanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <GlassCard className="p-3.5">
                    <p className="text-xs sm:text-sm text-cream/70 font-body">
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
                  className="text-xs sm:text-sm font-score text-center"
                >
                  {selectedIndex === question.correctIndex ? (
                    <span className="text-emerald font-bold">
                      {teams.find((t) => t.id === awardedTeam)?.name} answered correctly · +{CORRECT_POINTS} points
                    </span>
                  ) : (
                    <span className="text-kumkum font-bold">
                      {teams.find((t) => t.id === awardedTeam)?.name} answered incorrectly · +{WRONG_POINTS} points
                    </span>
                  )}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => {
            sfx.navigate();
            prevR2();
          }}
          disabled={r2Index === 0}
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {r2Index >= bank.round2.length - 1 ? (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 shadow-glow"
          >
            <Trophy size={16} /> Finish Round · View Scoreboard
          </button>
        ) : (
          <button
            onClick={() => {
              sfx.navigate();
              nextR2();
            }}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 shadow-glow"
          >
            Next Question <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

