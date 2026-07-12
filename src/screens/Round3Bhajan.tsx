import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Eye, ChevronRight, Music4, Upload, Award } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

export default function Round3Bhajan() {
  const { bank, r3Index, r3Revealed, nextR3, revealR3, teams, awardPoints } = useGameStore();
  const track = bank.round3[r3Index];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const { secondsLeft, running, start, reset } = useCountdown(30);
  const [awardedTeam, setAwardedTeam] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reset(30);
    setAwardedTeam(null);
    setPlaying(false);
    setCustomAudioUrl(null);
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
        nextR3();
      },
      onReveal: () => {
        if (!r3Revealed) {
          revealR3();
          sfx.reveal();
          fireMarigoldBurst();
        }
      },
      onPlayAudio: togglePlay,
      onStartTimer: () => start(),
    });
    return () => usePresenterActions.getState().clear();
  }, [r3Revealed, r3Index, playing]);

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cream/60 font-body">No bhajan tracks loaded. Add some via Manage Data.</p>
      </div>
    );
  }

  const audioSrc = customAudioUrl || track.audioUrl;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Round 3 · Bhajan Tune Challenge
        <span className="brass-divider w-8" />
        <span className="text-cream/40">
          {r3Index + 1} / {bank.round3.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={track.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <GlassCard arch glow="saffron" className="p-10 flex flex-col items-center gap-6">
            <motion.div
              animate={playing ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="h-32 w-32 rounded-full bg-gradient-to-br from-saffron-400 to-brass flex items-center justify-center shadow-glow"
            >
              <Music4 size={48} className="text-white" />
            </motion.div>

            {audioSrc ? (
              <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(false)} />
            ) : (
              <p className="text-xs text-cream/40 text-center">
                No audio file linked for this track yet — upload one below, attach it permanently via
                Manage Data on the dashboard, or simply play it from your own speaker system and use the
                controls to time it.
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
                <Upload size={14} /> Attach audio file (this session only)
              </button>
            )}

            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="btn-primary p-4 rounded-full">
                {playing ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
              </button>
              <DiyaTimer secondsLeft={secondsLeft} totalSeconds={30} running={running} size={110} />
              <button onClick={replay} className="btn-secondary p-4 rounded-full">
                <RotateCcw size={20} />
              </button>
            </div>

            {track.hint && !r3Revealed && (
              <p className="text-sm text-cream/50 italic text-center">Hint: {track.hint}</p>
            )}

            <AnimatePresence>
              {r3Revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-xs uppercase tracking-widest text-cream/40 mb-1">The bhajan is</p>
                  <h2 className="font-display text-3xl text-gradient-saffron font-bold">{track.bhajanName}</h2>
                  {track.singer && <p className="text-cream/50 mt-1 text-sm">{track.singer}</p>}
                  {track.image && (
                    <img src={track.image} alt={track.bhajanName} className="mt-4 rounded-2xl max-h-48 mx-auto" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!r3Revealed ? (
              <button
                onClick={() => {
                  revealR3();
                  sfx.reveal();
                  fireMarigoldBurst();
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Eye size={18} /> Reveal Bhajan Name
              </button>
            ) : (
              <>
                <div className="w-full">
                  <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-2 text-center">
                    Award {track.points ?? 15} points to the team that answered correctly:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          awardPoints(t.id, 'round3', track.points ?? 15);
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
                <button
                  onClick={() => {
                    sfx.navigate();
                    nextR3();
                  }}
                  disabled={r3Index >= bank.round3.length - 1}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  Next Tune <ChevronRight size={18} />
                </button>
              </>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
