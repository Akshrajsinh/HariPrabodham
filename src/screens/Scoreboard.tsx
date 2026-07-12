import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import { fireWinnerCelebration } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

export default function Scoreboard() {
  const teams = useGameStore((s) => s.teams);
  const [showWinner, setShowWinner] = useState(false);

  const ranked = useMemo(() => [...teams].sort((a, b) => b.totalScore - a.totalScore), [teams]);
  const maxScore = Math.max(1, ...teams.map((t) => t.totalScore));
  const winner = ranked[0];

  const celebrate = () => {
    setShowWinner(true);
    sfx.fanfare();
    fireWinnerCelebration();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Live Scoreboard
        <span className="brass-divider w-8" />
      </div>

      <div className="w-full max-w-3xl space-y-3">
        <AnimatePresence>
          {ranked.map((t, i) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <GlassCard
                className={`p-5 flex items-center gap-4 ${i === 0 ? 'shadow-glow border-marigold/40' : ''}`}
              >
                <span
                  className={`font-score font-bold text-xl h-11 w-11 flex items-center justify-center rounded-full shrink-0 ${
                    i === 0 ? 'bg-marigold text-night' : 'bg-white/10 text-cream/70'
                  }`}
                >
                  {i === 0 ? <Crown size={20} /> : i + 1}
                </span>
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-score font-semibold text-cream/90 truncate">{t.name}</p>
                  <div className="h-2 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${t.color}, #FFD08A)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.totalScore / maxScore) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <span className="font-score text-2xl font-bold text-gradient-saffron shrink-0">
                  {t.totalScore}
                </span>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <GlassCard className="w-full max-w-3xl p-5">
        <div className="grid grid-cols-5 gap-2 text-center mb-3">
          <span className="text-xs text-cream/40 font-score uppercase tracking-wide text-left pl-1">Team</span>
          {['R1', 'R2', 'R3', 'R4'].map((r) => (
            <span key={r} className="text-xs text-cream/40 font-score uppercase tracking-wide">
              {r}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {ranked.map((t) => (
            <div key={t.id} className="grid grid-cols-5 gap-2 text-center items-center">
              <span className="text-sm text-cream/70 font-score text-left pl-1 truncate">{t.name}</span>
              <span className="text-sm font-score text-cream/80">{t.roundScores.round1}</span>
              <span className="text-sm font-score text-cream/80">{t.roundScores.round2}</span>
              <span className="text-sm font-score text-cream/80">{t.roundScores.round3}</span>
              <span className="text-sm font-score text-cream/80">{t.roundScores.round4}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <button onClick={celebrate} className="btn-primary flex items-center gap-2 text-lg px-8">
        <Trophy size={20} /> Announce Winner
      </button>

      <AnimatePresence>
        {showWinner && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowWinner(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="text-8xl mb-6"
              >
                🏆
              </motion.div>
              <p className="font-score uppercase tracking-[0.3em] text-marigold text-sm mb-3">
                Champion of the Gyan Challenge
              </p>
              <h1 className="font-display text-6xl sm:text-8xl font-bold text-gradient-saffron drop-shadow-[0_4px_30px_rgba(255,167,51,0.5)]">
                {winner.name}
              </h1>
              <p className="mt-4 font-score text-2xl text-cream/80">{winner.totalScore} points</p>
              <p className="mt-8 text-cream/40 text-sm">Tap anywhere to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
