import { motion } from 'framer-motion';
import { Play, RotateCcw, Maximize, Settings2, Users } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import MandalaRing from '../components/MandalaRing';
import OmSymbol from '../components/OmSymbol';
import { sfx } from '../utils/sound';
import { useState } from 'react';
import QuestionManager from './QuestionManager';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

export default function Dashboard() {
  const { eventName, subtitle, eventStarted, currentRound, teams, startEvent, goToRound, resetGame } =
    useGameStore();
  const [showManager, setShowManager] = useState(false);

  const topTeam = [...teams].sort((a, b) => b.totalScore - a.totalScore)[0];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40">
        <MandalaRing size={640} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center mb-10"
      >
        <div className="mb-4 flex items-center justify-center gap-3 text-marigold/80 font-score text-xs tracking-[0.3em] uppercase">
          <span className="brass-divider w-10" />
          <OmSymbol size={20} className="text-brass" />
          Presenter Edition
          <OmSymbol size={20} className="text-brass" />
          <span className="brass-divider w-10" />
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-bold text-gradient-saffron drop-shadow-[0_2px_20px_rgba(255,107,26,0.35)]">
          {eventName}
        </h1>
        <p className="mt-3 font-body text-cream/60 text-lg">{subtitle}</p>
      </motion.div>

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {teams.map((t, i) => (
          <GlassCard key={t.id} delay={0.1 + i * 0.08} className="p-5 text-center">
            <div
              className="mx-auto mb-3 h-3 w-3 rounded-full"
              style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }}
            />
            <p className="font-score font-semibold text-cream/90 truncate">{t.name}</p>
            <p className="mt-1 font-score text-3xl font-bold text-gradient-saffron">{t.totalScore}</p>
            <p className="text-xs text-cream/40 mt-0.5">points</p>
          </GlassCard>
        ))}
      </div>

      {topTeam && topTeam.totalScore > 0 && (
        <p className="relative z-10 mb-6 text-sm text-cream/50 font-body">
          Leading: <span className="text-marigold font-semibold">{topTeam.name}</span> · Round in progress:{' '}
          <span className="text-cream/70">{currentRound}</span>
        </p>
      )}

      <GlassCard arch className="relative z-10 w-full max-w-lg p-8 flex flex-col items-center gap-4" delay={0.3}>
        {!eventStarted ? (
          <button
            onClick={() => {
              sfx.fanfare();
              startEvent();
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            <Play size={20} fill="currentColor" /> Start Event
          </button>
        ) : (
          <button
            onClick={() => {
              sfx.click();
              goToRound(currentRound === 'dashboard' ? 'round1' : currentRound);
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            <Play size={20} fill="currentColor" /> Continue Event
          </button>
        )}

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              sfx.click();
              toggleFullscreen();
            }}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Maximize size={18} /> Full Screen
          </button>
          <button
            onClick={() => setShowManager(true)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Settings2 size={18} /> Manage Data
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-cream/40">
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {teams.length} Teams
          </span>
          <button
            onClick={() => {
              if (confirm('Reset the entire event? All scores and progress will be cleared.')) {
                resetGame();
              }
            }}
            className="flex items-center gap-1.5 hover:text-kumkum transition-colors"
          >
            <RotateCcw size={14} /> Reset Event
          </button>
        </div>
      </GlassCard>

      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-2">
        {(['round1', 'round2', 'round3', 'round4'] as const).map((r, i) => (
          <button
            key={r}
            onClick={() => {
              sfx.navigate();
              goToRound(r);
            }}
            className="px-4 py-2 rounded-full glass text-xs font-score text-cream/70 hover:text-marigold hover:scale-105 transition-all"
          >
            Round {i + 1}
          </button>
        ))}
      </div>

      {showManager && <QuestionManager onClose={() => setShowManager(false)} />}
    </div>
  );
}
