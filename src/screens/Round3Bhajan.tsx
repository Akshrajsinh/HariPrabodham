import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Trophy,
  Music4,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

const CORRECT_POINTS = 20;
const WRONG_POINTS = -10;

export default function Round3Bhajan() {
  const {
    bank,
    r3Index,
    nextR3,
    prevR3,
    r3Revealed,
    revealR3,
    goToRound,
    teams,
    questionScoringLog,
    giveMarksOnce,
    cutMarksOnce,
    undoMarks,
    markQuestionCompleted,
  } = useGameStore();

  const track = bank.round3[r3Index];
  const { secondsLeft, running, start, pause, reset } = useCountdown(30);

  const [playing, setPlaying] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    reset(30);
    setPlaying(false);
    setCustomAudioUrl(null);
  }, [r3Index]);

  const handleAwardGive = (teamId: string) => {
    if (!track) return;
    const ok = giveMarksOnce(teamId, 'round3', track.id, CORRECT_POINTS);
    if (ok) {
      sfx.correct();
      fireMarigoldBurst();
    } else {
      sfx.wrong();
    }
  };

  const handleAwardCut = (teamId: string) => {
    if (!track) return;
    const ok = cutMarksOnce(teamId, 'round3', track.id, WRONG_POINTS);
    if (ok) {
      sfx.wrong();
    }
  };

  const handleUndoScore = (teamId: string, type: 'give' | 'cut') => {
    if (!track) return;
    undoMarks(teamId, 'round3', track.id, type);
    sfx.click();
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().catch(() => {});
      start();
      setPlaying(true);
    }
  };

  const replay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
    reset(30);
    start();
    setPlaying(true);
  };

  useEffect(() => {
    usePresenterActions.getState().register({
      onNext: () => {
        sfx.navigate();
        if (r3Index >= bank.round3.length - 1) {
          goToRound('scoreboard');
        } else {
          nextR3();
        }
      },
      onPrev: () => {
        sfx.navigate();
        prevR3();
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
  }, [r3Index]);

  if (!track) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-white text-xl font-body font-bold">No Bhajan tracks loaded. Add some via Manage Data.</p>
      </div>
    );
  }

  const audioSrc = customAudioUrl || track.audioUrl;

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 gap-4 my-auto max-w-6xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-center px-2">
        <div className="flex items-center gap-3 text-sm font-score uppercase tracking-[0.25em] text-marigold font-extrabold">
          <span className="brass-divider w-12" />
          <Sparkles size={18} className="text-marigold fill-marigold" />
          જ્ઞાન કસોટી · Round 3 Bhajan Challenge
          <Sparkles size={18} className="text-marigold fill-marigold" />
          <span className="brass-divider w-12" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 my-auto">
        {/* Left Side: Tune Player & Reveal */}
        <div className="lg:col-span-7 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <GlassCard arch glow="saffron" className="p-6 sm:p-8 flex flex-col items-center gap-5 text-center border-2 border-saffron-400/50 bg-gradient-to-b from-white/[0.2] via-white/[0.1] to-saffron-950/60 shadow-[0_12px_45px_rgba(255,107,26,0.3)]">
                <motion.div
                  animate={playing ? { rotate: 360 } : {}}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  className="h-28 w-28 rounded-full bg-gradient-to-br from-saffron-400 via-marigold to-saffron-500 flex items-center justify-center shadow-[0_0_35px_rgba(255,184,0,0.8)] border-2 border-white"
                >
                  <Music4 size={46} className="text-slate-950" />
                </motion.div>

                {audioSrc ? (
                  <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(false)} />
                ) : (
                  <p className="text-xs text-white/70 text-center">
                    No audio file linked — upload below or play from speaker system.
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCustomAudioUrl(URL.createObjectURL(file));
                  }}
                />
                {!audioSrc && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost flex items-center gap-1.5 text-xs text-marigold"
                  >
                    <Upload size={14} /> Attach audio file
                  </button>
                )}

                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="btn-primary p-4 rounded-full shadow-glow">
                    {playing ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
                  </button>
                  <DiyaTimer secondsLeft={secondsLeft} totalSeconds={30} running={running} size={100} />
                  <button onClick={replay} className="btn-secondary p-4 rounded-full">
                    <RotateCcw size={20} />
                  </button>
                </div>

                {track.hint && !r3Revealed && (
                  <p className="text-xs text-white/80 italic bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                    Hint: {track.hint}
                  </p>
                )}

                <AnimatePresence>
                  {r3Revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center w-full bg-black/40 p-4 rounded-2xl border border-white/20"
                    >
                      <p className="text-xs uppercase tracking-widest text-marigold font-bold mb-1">The bhajan is</p>
                      <h2 className="font-display text-3xl text-gradient-gold font-extrabold">{track.bhajanName}</h2>
                      {track.singer && <p className="text-white/70 mt-1 text-xs">{track.singer}</p>}
                      {track.image && (
                        <img src={track.image} alt={track.bhajanName} className="mt-3 rounded-xl max-h-40 mx-auto" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!r3Revealed && (
                  <button
                    onClick={() => {
                      revealR3();
                      markQuestionCompleted('round3', track.id);
                      sfx.reveal();
                      fireMarigoldBurst();
                    }}
                    className="btn-primary flex items-center gap-2 text-sm px-7 py-3 font-extrabold"
                  >
                    <Eye size={18} /> Reveal Bhajan Name
                  </button>
                )}
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Team Scoring Panel */}
        <div className="lg:col-span-5 w-full">
          <GlassCard arch glow="saffron" className="p-6 space-y-4 border-2 border-saffron-400/50">
            <div className="border-b border-white/20 pb-3 text-center">
              <span className="text-xs font-score uppercase tracking-widest text-marigold font-extrabold block">
                ★ Team Scoring Controls
              </span>
              <p className="text-[11px] text-white/60 mt-0.5">Correct = +20 pts · Wrong = -10 pts</p>
            </div>

            <div className="space-y-3">
              {teams.map((t) => {
                const scoreLog = questionScoringLog[`round3_${track.id}_${t.id}`] || {};
                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-between gap-3 shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-glow"
                        style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }}
                      />
                      <div>
                        <p className="font-score font-extrabold text-sm text-white truncate">{t.name}</p>
                        <p className="text-xs font-score text-saffron-300 font-bold">
                          Score: {t.totalScore} pts
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {scoreLog.gave ? (
                        <span className="px-2.5 py-1.5 rounded-xl text-xs font-score font-extrabold bg-emerald-700/80 text-emerald-100 border border-emerald-400 flex items-center gap-1">
                          ✓ +20
                          <button
                            onClick={() => handleUndoScore(t.id, 'give')}
                            className="ml-1 text-[10px] text-emerald-200 hover:text-white underline"
                            title="Undo +20"
                          >
                            Undo
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAwardGive(t.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-score font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-300 shadow flex items-center gap-1"
                          title="Award Correct (+20 pts)"
                        >
                          <CheckCircle2 size={14} /> +20
                        </button>
                      )}

                      {scoreLog.cut ? (
                        <span className="px-2.5 py-1.5 rounded-xl text-xs font-score font-extrabold bg-red-700/80 text-red-100 border border-red-400 flex items-center gap-1">
                          ✗ -10
                          <button
                            onClick={() => handleUndoScore(t.id, 'cut')}
                            className="ml-1 text-[10px] text-red-200 hover:text-white underline"
                            title="Undo -10"
                          >
                            Undo
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAwardCut(t.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-score font-extrabold bg-red-600 hover:bg-red-500 text-white border border-red-300 shadow flex items-center gap-1"
                          title="Deduct Wrong (-10 pts)"
                        >
                          <XCircle size={14} /> -10
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Navigation Control Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-4 px-2 pt-2 border-t border-white/10">
        <button
          onClick={() => {
            sfx.navigate();
            prevR3();
          }}
          disabled={r3Index === 0}
          className="btn-secondary text-xs px-5 py-2.5 flex items-center gap-1.5 border-2 border-white/30 disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Previous Question
        </button>

        <span className="text-xs font-score text-saffron-300 font-extrabold uppercase tracking-widest bg-black/50 px-4 py-1.5 rounded-full border border-saffron-500/30">
          Track {r3Index + 1} of {bank.round3.length}
        </span>

        {r3Index >= bank.round3.length - 1 ? (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary text-xs px-6 py-2.5 font-extrabold flex items-center gap-1.5 shadow-[0_0_30px_rgba(255,145,0,0.8)]"
          >
            <Trophy size={16} /> Finish Round 3 · Scoreboard
          </button>
        ) : (
          <button
            onClick={() => {
              sfx.navigate();
              nextR3();
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
