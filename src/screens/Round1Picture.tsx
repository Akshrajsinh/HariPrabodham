import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Upload, Award, ImageIcon, Plus, X, Trophy, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';
import { compressImageToDataUrl } from '../utils/image';
import type { ImageQuestion } from '../types';

const emptyDraft = (): ImageQuestion => ({
  id: `img-${Date.now()}`,
  image: '',
  question: '',
  correctAnswer: '',
  points: 15,
});

export default function Round1Picture() {
  const {
    bank,
    setBank,
    r1Index,
    r1Revealed,
    nextR1,
    prevR1,
    revealR1,
    goToR1,
    goToRound,
    teams,
    awardPoints,
    markQuestionCompleted,
  } = useGameStore();

  const question = bank.round1[r1Index];
  const { secondsLeft, running, start, reset } = useCountdown(30);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(bank.round1.length === 0);
  const [draft, setDraft] = useState<ImageQuestion>(emptyDraft());
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerStartedRef = useRef(false);

  // Reset timer and start it automatically when question changes
  useEffect(() => {
    reset(30);
    setAwardedTeam(null);
    timerStartedRef.current = false;
    // Start timer automatically when question loads and is not revealed yet
    if (!r1Revealed) {
      start();
      timerStartedRef.current = true;
    }
  }, [r1Index]);

  // Start timer when question is revealed
  useEffect(() => {
    if (r1Revealed && !timerStartedRef.current) {
      start();
      timerStartedRef.current = true;
    }
  }, [r1Revealed]);

  useEffect(() => {
    if (bank.round1.length === 0) setShowAddForm(true);
  }, [bank.round1.length]);

  const reveal = () => {
    if (!question || r1Revealed) return;
    revealR1();
    markQuestionCompleted('round1', question.id);
    sfx.reveal();
    fireMarigoldBurst();
    // Start timer when reveal is clicked
    if (!timerStartedRef.current) {
      start();
      timerStartedRef.current = true;
    }
  };

  useEffect(() => {
    usePresenterActions.getState().register({
      onNext: () => {
        sfx.navigate();
        if (r1Revealed && r1Index >= bank.round1.length - 1) {
          goToRound('scoreboard');
        } else {
          nextR1();
        }
      },
      onPrev: () => {
        sfx.navigate();
        prevR1();
      },
      onReveal: reveal,
      onStartTimer: () => {
        if (!timerStartedRef.current) {
          start();
          timerStartedRef.current = true;
        }
      },
    });
    return () => usePresenterActions.getState().clear();
  }, [r1Index, r1Revealed, question]);

  const saveDraft = () => {
    if (!draft.image || !draft.question.trim() || !draft.correctAnswer.trim()) {
      sfx.wrong();
      return;
    }
    try {
      const nextBank = { ...bank, round1: [...bank.round1, draft] };
      setBank(nextBank);
      sfx.correct();
      const newIndex = nextBank.round1.length - 1;
      setDraft(emptyDraft());
      setShowAddForm(false);
      setImageError('');
      // jump presenter view to the freshly added question
      goToR1(newIndex);
    } catch {
      sfx.wrong();
      setImageError(
        'Could not save that question — the browser may be out of storage space. Try removing an older question or using a smaller image.'
      );
    }
  };

  const onPickImage = async (file: File) => {
    setImageBusy(true);
    setImageError('');
    try {
      const compressed = await compressImageToDataUrl(file);
      setDraft((d) => ({ ...d, image: compressed }));
    } catch {
      setImageError('Could not process that image — try a different file.');
    } finally {
      setImageBusy(false);
    }
  };

  if (showAddForm) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 my-auto gap-4">
        <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
          <span className="brass-divider w-8" />
          Round 1 · Picture Question
          <span className="brass-divider w-8" />
        </div>

        <GlassCard arch className="p-6 sm:p-8 w-full max-w-2xl space-y-4">
          <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
            Step 1 · Upload the image
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickImage(file);
              e.target.value = '';
            }}
          />
          {draft.image ? (
            <div className="relative">
              <img src={draft.image} alt="Question" className="w-full max-h-56 object-contain rounded-2xl bg-black/20" />
              <button
                onClick={() => setDraft((d) => ({ ...d, image: '' }))}
                className="absolute top-2 right-2 bg-black/60 hover:bg-kumkum text-white rounded-full p-1.5"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageBusy}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-white/15 disabled:opacity-50"
            >
              <Upload size={18} /> {imageBusy ? 'Processing image…' : 'Upload Image'}
            </button>
          )}
          {imageError && <p className="text-xs text-kumkum">{imageError}</p>}

          <p className="text-xs font-score uppercase tracking-wide text-marigold/80 pt-2">
            Step 2 · Write the question
          </p>
          <textarea
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            placeholder="What does this image depict?"
            rows={2}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
          />

          <p className="text-xs font-score uppercase tracking-wide text-marigold/80 pt-2">
            Step 3 · Write the correct answer
          </p>
          <input
            value={draft.correctAnswer}
            onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
            placeholder="Correct answer (shown after you click Reveal)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
          />

          <div className="grid grid-cols-2 gap-2 items-center pt-1">
            <input
              type="number"
              value={draft.points}
              onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
              placeholder="Points"
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
            />
            <span className="text-xs text-cream/40">points for a correct answer</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={saveDraft}
              disabled={imageBusy}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} /> Add Question & Show It
            </button>
            {bank.round1.length > 0 && (
              <button onClick={() => setShowAddForm(false)} className="btn-secondary px-4">
                Cancel
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-cream/60 font-body">No picture questions loaded yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 gap-4 my-auto max-w-6xl mx-auto">
      <div className="w-full flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3 text-sm font-score uppercase tracking-[0.25em] text-marigold font-extrabold mx-auto">
          <span className="brass-divider w-12" />
          <Sparkles size={18} className="text-marigold fill-marigold" />
          જ્ઞાન કસોટી · Round 1 Picture Question
          <Sparkles size={18} className="text-marigold fill-marigold" />
          <span className="brass-divider w-12" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="w-full flex-1 flex flex-col justify-center"
        >
          <GlassCard arch glow="saffron" className="p-6 sm:p-8 flex flex-col items-center gap-5 text-center border-2 border-amber-300/40 shadow-[0_12px_45px_rgba(0,0,0,0.6)] bg-gradient-to-b from-white/[0.18] via-white/[0.08] to-purple-950/60">
            {question.image ? (
              <div className="p-1.5 rounded-2xl bg-gradient-to-b from-amber-300/50 via-white/20 to-amber-500/30 shadow-[0_0_35px_rgba(255,184,0,0.3)]">
                <img
                  src={question.image}
                  alt="Question"
                  className="w-full max-h-[42vh] sm:max-h-[380px] object-contain rounded-xl bg-black/50 shadow-inner"
                />
              </div>
            ) : (
              <div className="w-full h-44 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 border border-white/20">
                <ImageIcon size={44} />
              </div>
            )}

            <h2 className="font-display text-3xl sm:text-4xl text-white font-extrabold leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {question.question}
            </h2>

            <div className="flex items-center justify-center gap-6 my-1">
              <DiyaTimer secondsLeft={secondsLeft} totalSeconds={30} running={running} size={120} />
            </div>

            <AnimatePresence>
              {r1Revealed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center my-1">
                  <p className="text-xs font-score uppercase tracking-[0.25em] text-amber-200 font-extrabold mb-1">The correct answer is</p>
                  <h2 className="font-display text-3xl sm:text-4xl text-gradient-gold font-extrabold drop-shadow-md">{question.correctAnswer}</h2>
                </motion.div>
              )}
            </AnimatePresence>

            {!r1Revealed ? (
              <button onClick={reveal} className="btn-primary flex items-center gap-2 text-sm px-8 py-3.5 shadow-[0_0_40px_rgba(255,145,0,0.8)] font-extrabold">
                <Eye size={18} /> Reveal Answer
              </button>
            ) : (
              <div className="w-full space-y-4">
                <div className="w-full">
                  <p className="text-xs font-score uppercase tracking-widest text-amber-200 mb-2.5 text-center font-extrabold">
                    ★ Award {question.points ?? 5} points (Correct = +5, Wrong = 0) to the team that answered:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          awardPoints(t.id, 'round1', question.points ?? 5);
                          markQuestionCompleted('round1', question.id);
                          setAwardedTeam(t.id);
                          sfx.correct();
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-score font-extrabold flex items-center gap-2 transition-all ${
                          awardedTeam === t.id
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-[0_0_25px_rgba(16,185,129,0.8)] border-2 border-white scale-105'
                            : 'glass text-white hover:text-white hover:border-amber-300/60'
                        }`}
                      >
                        <Award size={16} className={awardedTeam === t.id ? 'text-white' : 'text-amber-300'} /> {t.name} (+5 pts)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      sfx.navigate();
                      prevR1();
                    }}
                    disabled={r1Index === 0}
                    className="btn-secondary flex items-center gap-1.5 text-xs px-5 py-2.5 border-2 border-white/30 hover:border-amber-300"
                  >
                    <ChevronLeft size={16} /> Previous Question
                  </button>
                  {r1Index >= bank.round1.length - 1 ? (
                    <>
                      <button
                        onClick={() => {
                          sfx.navigate();
                          goToRound('scoreboard');
                        }}
                        className="btn-primary flex items-center gap-1.5 text-xs px-6 py-2.5 font-extrabold shadow-[0_0_30px_rgba(255,145,0,0.8)]"
                      >
                        <Trophy size={16} /> Finish Round · Scoreboard
                      </button>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-secondary flex items-center gap-1.5 text-xs px-5 py-2.5 border-2 border-white/30"
                      >
                        <Plus size={16} /> Add Question
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        sfx.navigate();
                        nextR1();
                      }}
                      className="btn-primary flex items-center gap-1.5 text-xs px-6 py-2.5 font-extrabold shadow-[0_0_30px_rgba(255,145,0,0.8)]"
                    >
                      Next Question <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}