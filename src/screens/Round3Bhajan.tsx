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
  QrCode,
  Sparkles,
  Lock,
  Unlock,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import QRCodeModal from '../components/QRCodeModal';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';
import { buzzerChannel } from '../utils/buzzerChannel';
import type { BuzzerSignal } from '../utils/buzzerChannel';

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
    awardPoints,
    markQuestionCompleted,
  } = useGameStore();

  const track = bank.round3[r3Index];
  const { secondsLeft, running, start, pause, reset } = useCountdown(30);

  const [playing, setPlaying] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [, setAwardedTeam] = useState<string | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  const { buzzerQueue, buzzersLocked, registerBuzzer, setBuzzerLock, resetBuzzers } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    reset(30);
    setAwardedTeam(null);
    setPlaying(false);
    setCustomAudioUrl(null);
    resetBuzzers();
    buzzerChannel.send({ type: 'RESET' });
    buzzerChannel.send({ type: 'SYNC', queue: [], locked: buzzersLocked });
  }, [r3Index]);

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
      setBuzzerLock(false);
      buzzerChannel.send({ type: 'LOCK', locked: false });
      buzzerChannel.send({ type: 'SYNC', queue: buzzerQueue, locked: false });
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
    resetBuzzers();
    setBuzzerLock(false);
    buzzerChannel.send({ type: 'RESET' });
    buzzerChannel.send({ type: 'SYNC', queue: [], locked: false });
  };

  const handleClearBuzzers = () => {
    sfx.click();
    resetBuzzers();
    buzzerChannel.send({ type: 'RESET' });
    buzzerChannel.send({ type: 'SYNC', queue: [], locked: buzzersLocked });
  };

  const handleToggleLock = () => {
    sfx.click();
    const nextLocked = !buzzersLocked;
    setBuzzerLock(nextLocked);
    buzzerChannel.send({ type: 'LOCK', locked: nextLocked });
    buzzerChannel.send({ type: 'SYNC', queue: buzzerQueue, locked: nextLocked });
  };

  const handleAwardPoints = (teamId: string, isCorrect: boolean) => {
    if (!track) return;
    const pts = isCorrect ? CORRECT_POINTS : WRONG_POINTS;
    awardPoints(teamId, 'round3', pts);
    setAwardedTeam(teamId);
    markQuestionCompleted('round3', track.id);
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

  // Subscribe to live WebSocket QR buzzer signals
  useEffect(() => {
    const unsub = buzzerChannel.subscribe((msg: BuzzerSignal) => {
      if (msg.type === 'BUZZ' && msg.teamId && msg.teamName) {
        const result = registerBuzzer(msg.teamId, msg.teamName);
        if (result.success) {
          sfx.click();
          const currentQueue = useGameStore.getState().buzzerQueue;
          const isLocked = useGameStore.getState().buzzersLocked;
          buzzerChannel.send({ type: 'SYNC', queue: currentQueue, locked: isLocked });
        }
      } else if (msg.type === 'JOIN' && msg.teamId) {
        const currentQueue = useGameStore.getState().buzzerQueue;
        const isLocked = useGameStore.getState().buzzersLocked;
        buzzerChannel.send({ type: 'SYNC', queue: currentQueue, locked: isLocked });
      }
    });

    buzzerChannel.send({ type: 'SYNC', queue: buzzerQueue, locked: buzzersLocked });
    return () => unsub();
  }, []);

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
      {/* Header & QR Button */}
      <div className="w-full flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3 text-sm font-score uppercase tracking-[0.25em] text-marigold font-extrabold">
          <span className="brass-divider w-12" />
          <Sparkles size={18} className="text-marigold fill-marigold" />
          જ્ઞાન કસોટી · Round 3 Bhajan Challenge
          <Sparkles size={18} className="text-marigold fill-marigold" />
          <span className="brass-divider w-12" />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-saffron-300 bg-saffron-950/80 px-3 py-2 rounded-xl border border-saffron-500/40 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Room: <strong className="uppercase text-white">{buzzerChannel.getRoom()}</strong>
          </span>

          <button
            onClick={() => setShowQRModal(true)}
            className="btn-primary px-5 py-2.5 text-xs font-score flex items-center gap-2 rounded-2xl shadow-[0_0_30px_rgba(255,145,0,0.7)] font-extrabold"
          >
            <QrCode size={18} /> Scan Team Buzzer QR
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 my-auto">
        {/* Left Side: Tune Player & Controls */}
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
                  <p className="text-xs text-white/80 italic bg-white/10 px-4 py-2 rounded-xl border border-white/20">Hint: {track.hint}</p>
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

                {!r3Revealed ? (
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
                ) : (
                  <div className="w-full space-y-3">
                    <p className="text-xs font-score uppercase tracking-widest text-marigold text-center font-extrabold">
                      ★ Manual Scoring: Correct (+20) · Wrong (-10)
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {teams.map((t) => (
                        <div key={t.id} className="flex items-center gap-1 glass p-1.5 rounded-xl border border-white/20">
                          <span className="text-xs font-score font-bold text-white px-1.5">{t.name}</span>
                          <button
                            onClick={() => handleAwardPoints(t.id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                          >
                            +20
                          </button>
                          <button
                            onClick={() => handleAwardPoints(t.id, false)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                          >
                            -10
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Round 3 Buzzer Base & Rank-Wise Queue */}
        <div className="lg:col-span-5 w-full">
          <GlassCard arch glow="saffron" className="p-6 space-y-4 border-2 border-saffron-400/50">
            {/* Buzzer Base Header & Lock Controls */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2 font-score text-sm font-extrabold text-marigold">
                <Zap size={18} className="text-saffron-400 fill-saffron-400" />
                Live Buzzer Base
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleLock}
                  className={`px-2.5 py-1 rounded-lg text-xs font-score font-bold flex items-center gap-1.5 transition-all ${
                    buzzersLocked
                      ? 'bg-red-600 text-white border border-red-400'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                  }`}
                  title="Toggle Buzzer Lock State"
                >
                  {buzzersLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  {buzzersLocked ? 'Locked' : 'Open'}
                </button>
                <button
                  onClick={handleClearBuzzers}
                  className="btn-secondary px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 border border-white/30"
                  title="Clear Buzzers"
                >
                  <RefreshCw size={14} /> Clear
                </button>
              </div>
            </div>

            {/* Rank-Wise Buzzer Display */}
            <div className="space-y-2.5 min-h-[220px]">
              {buzzerQueue.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-white/20 text-white/50 space-y-2">
                  <Zap size={32} className="text-marigold animate-pulse" />
                  <p className="text-xs font-bold text-white">No team has buzzed yet!</p>
                  <p className="text-[11px] text-white/60">
                    Play the tune & click <span className="text-marigold font-bold">Scan Team Buzzer QR</span> above
                    to let teams buzz from their phones.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {buzzerQueue.map((entry) => {
                    const is1st = entry.rank === 1;
                    const is2nd = entry.rank === 2;
                    const is3rd = entry.rank === 3;

                    return (
                      <motion.div
                        key={entry.teamId}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                          is1st
                            ? 'bg-gradient-to-r from-saffron-600/40 via-marigold/20 to-amber-500/20 border-saffron-400 shadow-[0_0_25px_rgba(255,167,51,0.6)]'
                            : is2nd
                            ? 'bg-white/15 border-white/30'
                            : 'bg-white/10 border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Medal Badge */}
                          <span
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-score font-extrabold text-sm shrink-0 shadow-md ${
                              is1st
                                ? 'bg-saffron-500 text-white border-2 border-white'
                                : is2nd
                                ? 'bg-slate-200 text-slate-900 border border-white'
                                : is3rd
                                ? 'bg-amber-600 text-white border border-white'
                                : 'bg-white/20 text-white'
                            }`}
                          >
                            {is1st ? '🥇' : is2nd ? '🥈' : is3rd ? '🥉' : `#${entry.rank}`}
                          </span>

                          <div className="min-w-0">
                            <p className="font-score font-extrabold text-sm text-white truncate">{entry.teamName}</p>
                            <p className="text-[11px] text-white/60">
                              {is1st
                                ? 'Fastest Buzzer!'
                                : `+${entry.timeDiffMs ?? 0}ms behind Rank #1`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAwardPoints(entry.teamId, true)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-score font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-300 shadow flex items-center gap-1"
                            title="Correct (+20 pts)"
                          >
                            <CheckCircle2 size={14} /> +20
                          </button>
                          <button
                            onClick={() => handleAwardPoints(entry.teamId, false)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-score font-extrabold bg-red-600 hover:bg-red-500 text-white border border-red-300 shadow flex items-center gap-1"
                            title="Wrong (-10 pts)"
                          >
                            <XCircle size={14} /> -10
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Navigation Control Bar */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => {
            sfx.navigate();
            prevR3();
          }}
          disabled={r3Index === 0}
          className="btn-secondary text-sm px-7 py-3.5 flex items-center gap-2 border-2 border-white/30 hover:border-saffron-300"
        >
          <ChevronLeft size={20} /> Previous Question
        </button>

        {r3Index >= bank.round3.length - 1 ? (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary text-sm px-8 py-3.5 flex items-center gap-2 shadow-[0_0_40px_rgba(255,107,26,0.8)] font-extrabold"
          >
            <Trophy size={20} /> Finish Round 3 · View Scoreboard
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

      {showQRModal && <QRCodeModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}
