import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Music4,
  Upload,
  Award,
  Trophy,
  QrCode,
  RefreshCw,
  Lock,
  Unlock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import QRCodeModal from '../components/QRCodeModal';
import QuestionStepperBar from '../components/QuestionStepperBar';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';
import { buzzerChannel } from '../utils/buzzerChannel';
import type { BuzzerSignal } from '../utils/buzzerChannel';


export default function Round3Bhajan() {
  const {
    bank,
    r3Index,
    r3Revealed,
    nextR3,
    prevR3,
    goToR3,
    revealR3,
    goToRound,
    teams,
    awardPoints,
    buzzerQueue,
    buzzersLocked,
    registerBuzzer,
    resetBuzzers,
    setBuzzerLock,
    markQuestionCompleted,
  } = useGameStore();

  const track = bank.round3[r3Index];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const { secondsLeft, running, start, reset } = useCountdown(30);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to buzzer channel updates
  useEffect(() => {
    const unsub = buzzerChannel.subscribe((signal: BuzzerSignal) => {
      if (signal.type === 'BUZZ' && signal.teamId) {
        sfx.fanfare();
        registerBuzzer(signal.teamId, signal.teamName);
      }
    });
    return unsub;
  }, [registerBuzzer]);

  useEffect(() => {
    reset(30);
    setAwardedTeam(null);
    setPlaying(false);
    setCustomAudioUrl(null);
    resetBuzzers();
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
      // Automatically unlock buzzers when tune starts playing!
      setBuzzerLock(false);
      buzzerChannel.send({ type: 'LOCK', locked: false });
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
  };

  const handleClearBuzzers = () => {
    sfx.click();
    resetBuzzers();
    buzzerChannel.send({ type: 'RESET' });
  };

  const handleToggleLock = () => {
    sfx.click();
    const nextLocked = !buzzersLocked;
    setBuzzerLock(nextLocked);
    buzzerChannel.send({ type: 'LOCK', locked: nextLocked });
  };

  const handleAwardPoints = (teamId: string) => {
    if (!track) return;
    const pts = track.points ?? 15;
    awardPoints(teamId, 'round3', pts);
    setAwardedTeam(teamId);
    markQuestionCompleted('round3', track.id);
    sfx.correct();
    fireMarigoldBurst();
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
      onReveal: () => {
        if (!r3Revealed) {
          revealR3();
          if (track) markQuestionCompleted('round3', track.id);
          sfx.reveal();
          fireMarigoldBurst();
        }
      },
      onPlayAudio: togglePlay,
      onStartTimer: () => start(),
    });
    return () => usePresenterActions.getState().clear();
  }, [r3Revealed, r3Index, playing, track]);

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cream/60 font-body">No bhajan tracks loaded. Add some via Manage Data.</p>
      </div>
    );
  }

  const audioSrc = customAudioUrl || track.audioUrl;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 gap-6">
      {/* Header & QR Button */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
          <span className="brass-divider w-8" />
          Round 3 · Bhajan Tune Challenge
          <span className="brass-divider w-8" />
        </div>

        <button
          onClick={() => setShowQRModal(true)}
          className="btn-primary px-4 py-2 text-xs font-score flex items-center gap-2 rounded-xl shadow-glow"
        >
          <QrCode size={16} /> Scan Team Buzzer QR
        </button>
      </div>

      {/* Check Mark Navigation Stepper */}
      <QuestionStepperBar
        round="round3"
        currentIndex={r3Index}
        totalQuestions={bank.round3.length}
        onSelectIndex={(i) => goToR3(i)}
        questionIds={bank.round3.map((t) => t.id)}
      />

      {/* Main Content Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
              <GlassCard arch glow="saffron" className="p-8 flex flex-col items-center gap-5 text-center">
                <motion.div
                  animate={playing ? { rotate: 360 } : {}}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  className="h-28 w-28 rounded-full bg-gradient-to-br from-saffron-400 to-brass flex items-center justify-center shadow-glow"
                >
                  <Music4 size={42} className="text-white" />
                </motion.div>

                {audioSrc ? (
                  <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(false)} />
                ) : (
                  <p className="text-xs text-cream/40 text-center">
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
                    className="btn-ghost flex items-center gap-1.5 text-xs"
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
                  <p className="text-xs text-cream/60 italic bg-white/5 px-4 py-2 rounded-xl">Hint: {track.hint}</p>
                )}

                <AnimatePresence>
                  {r3Revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center w-full bg-black/30 p-4 rounded-2xl border border-white/10"
                    >
                      <p className="text-xs uppercase tracking-widest text-marigold mb-1">The bhajan is</p>
                      <h2 className="font-display text-2xl text-gradient-saffron font-bold">{track.bhajanName}</h2>
                      {track.singer && <p className="text-cream/60 mt-1 text-xs">{track.singer}</p>}
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
                    className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5"
                  >
                    <Eye size={16} /> Reveal Bhajan Name
                  </button>
                ) : (
                  <div className="w-full space-y-3">
                    <p className="text-xs font-score uppercase tracking-widest text-cream/40 text-center">
                      Manual Award ({track.points ?? 15} pts):
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {teams.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleAwardPoints(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-score flex items-center gap-1.5 transition-all ${
                            awardedTeam === t.id
                              ? 'bg-emerald/80 text-white'
                              : 'glass text-cream/70 hover:text-cream'
                          }`}
                        >
                          <Award size={13} /> {t.name}
                        </button>
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
          <GlassCard arch glow="saffron" className="p-6 space-y-4">

            {/* Buzzer Base Header & Lock Controls */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-score text-sm font-bold text-marigold">
                <Zap size={18} className="text-saffron-400 fill-saffron-400" />
                Live Buzzer Base
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleLock}
                  className={`px-2.5 py-1 rounded-lg text-xs font-score flex items-center gap-1.5 transition-all ${
                    buzzersLocked
                      ? 'bg-kumkum/80 text-white border border-kumkum'
                      : 'bg-emerald/20 text-emerald border border-emerald/40'
                  }`}
                  title="Toggle Buzzer Lock State"
                >
                  {buzzersLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  {buzzersLocked ? 'Locked' : 'Open'}
                </button>
                <button
                  onClick={handleClearBuzzers}
                  className="btn-secondary px-2 py-1 text-xs rounded-lg flex items-center gap-1"
                  title="Clear Buzzers"
                >
                  <RefreshCw size={12} /> Clear
                </button>
              </div>
            </div>

            {/* Rank-Wise Buzzer Display */}
            <div className="space-y-2 min-h-[220px]">
              {buzzerQueue.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-white/10 text-cream/40 space-y-2">
                  <Zap size={32} className="text-cream/20 animate-pulse" />
                  <p className="text-xs">No team has buzzed yet!</p>
                  <p className="text-[11px] text-cream/30">
                    Play the tune & click <span className="text-marigold font-semibold">Scan Team Buzzer QR</span> above
                    to let teams buzz from their phones.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {buzzerQueue.map((entry) => {
                    const is1st = entry.rank === 1;
                    const is2nd = entry.rank === 2;
                    const is3rd = entry.rank === 3;
                    const isAwarded = awardedTeam === entry.teamId;

                    return (
                      <motion.div
                        key={entry.teamId}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          is1st
                            ? 'bg-gradient-to-r from-saffron-600/30 to-brass/20 border-saffron-400 shadow-glow'
                            : is2nd
                            ? 'bg-white/10 border-white/20'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Medal Badge */}
                          <span
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-score font-bold text-sm shrink-0 shadow-md ${
                              is1st
                                ? 'bg-saffron-500 text-white shadow-saffron-500/50'
                                : is2nd
                                ? 'bg-slate-300 text-slate-900'
                                : is3rd
                                ? 'bg-amber-700 text-white'
                                : 'bg-white/10 text-cream/70'
                            }`}
                          >
                            {is1st ? '🥇' : is2nd ? '🥈' : is3rd ? '🥉' : `#${entry.rank}`}
                          </span>

                          <div className="min-w-0">
                            <p className="font-score font-bold text-sm text-cream truncate">{entry.teamName}</p>
                            <p className="text-[11px] text-cream/50">
                              {is1st
                                ? 'Fastest Buzzer!'
                                : `+${entry.timeDiffMs ?? 0}ms behind Rank #1`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAwardPoints(entry.teamId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-score flex items-center gap-1 shrink-0 transition-all ${
                            isAwarded
                              ? 'bg-emerald text-white font-bold'
                              : is1st
                              ? 'btn-primary py-1.5 text-xs'
                              : 'btn-secondary py-1.5 text-xs'
                          }`}
                        >
                          {isAwarded ? (
                            <>
                              <CheckCircle2 size={13} /> +{track.points ?? 15} pts
                            </>
                          ) : (
                            <>
                              <Award size={13} /> Award +{track.points ?? 15}
                            </>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Quick Navigation Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  sfx.navigate();
                  prevR3();
                }}
                disabled={r3Index === 0}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Prev Tune
              </button>

              {r3Index >= bank.round3.length - 1 ? (
                <button
                  onClick={() => {
                    sfx.navigate();
                    goToRound('scoreboard');
                  }}
                  className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Trophy size={14} /> View Scoreboard
                </button>
              ) : (
                <button
                  onClick={() => {
                    sfx.navigate();
                    nextR3();
                  }}
                  className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                >
                  Next Tune <ChevronRight size={14} />
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && <QRCodeModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}
