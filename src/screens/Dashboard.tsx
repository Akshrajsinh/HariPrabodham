import { motion } from 'framer-motion';
import { Play, RotateCcw, Maximize, Settings2, Users, QrCode, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import MandalaRing from '../components/MandalaRing';
import OmSymbol from '../components/OmSymbol';
import RoundRulesModal from '../components/RoundRulesModal';
import QRCodeModal from '../components/QRCodeModal';
import { sfx } from '../utils/sound';
import { useState } from 'react';
import QuestionManager from './QuestionManager';
import type { RoundKey } from '../types';

type PlayableRound = 'round1' | 'round2' | 'round3' | 'round4';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

export default function Dashboard() {
  const { eventName, subtitle, eventStarted, currentRound, teams, startEvent, goToRound, resetGame, completedQuestions } =
    useGameStore();
  const [showManager, setShowManager] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pending, setPending] = useState<{ round: PlayableRound; kind: 'start' | 'nav' } | null>(null);

  const topTeam = [...teams].sort((a, b) => b.totalScore - a.totalScore)[0];
  const totalCompleted =
    (completedQuestions.round1?.length || 0) +
    (completedQuestions.round2?.length || 0) +
    (completedQuestions.round3?.length || 0) +
    (completedQuestions.round4?.length || 0);

  const requestRound = (round: PlayableRound, kind: 'start' | 'nav') => {
    sfx.click();
    setPending({ round, kind });
  };

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'start') {
      sfx.fanfare();
      startEvent();
    } else {
      sfx.navigate();
      goToRound(pending.round);
    }
    setPending(null);
  };

  return (
    <div className="relative flex-1 w-full flex flex-col items-center justify-between p-4 sm:p-6 my-auto max-w-7xl mx-auto overflow-hidden">
      {/* Background Sacred Mandala */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <MandalaRing size={680} />
      </div>

      {/* Swamiji Left Divine Portrait (Fixed Sidebar on XL screens) */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden xl:flex flex-col items-center gap-2 absolute left-4 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="p-1.5 rounded-3xl bg-gradient-to-b from-amber-400/60 via-saffron-500/30 to-amber-600/60 border border-amber-300/50 shadow-[0_0_40px_rgba(255,167,51,0.4)]">
          <div className="relative w-44 h-56 rounded-2xl overflow-hidden bg-black/40 border border-amber-200/30">
            <img
              src="/images/swamiji1.jpg"
              alt="Swamiji Maharaj"
              className="w-full h-full object-cover shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-[11px] font-score font-bold text-amber-200 drop-shadow-md text-center">
                હરિપ્રસાદ સ્વામીજી મહારાજ
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Swamiji Right Divine Portrait (Fixed Sidebar on XL screens) */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden xl:flex flex-col items-center gap-2 absolute right-4 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="p-1.5 rounded-3xl bg-gradient-to-b from-amber-400/60 via-saffron-500/30 to-amber-600/60 border border-amber-300/50 shadow-[0_0_40px_rgba(255,167,51,0.4)]">
          <div className="relative w-44 h-56 rounded-2xl overflow-hidden bg-black/40 border border-amber-200/30">
            <img
              src="/images/swamiji2.jpg"
              alt="Prabodh Swamiji Maharaj"
              className="w-full h-full object-cover shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-[11px] font-score font-bold text-amber-200 drop-shadow-md text-center">
                પ્રબોધ સ્વામીજી મહારાજ
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center mb-6"
      >
        {/* Mobile/Tablet Inline Swamiji Portraits (Visible below XL screens) */}
        <div className="flex xl:hidden items-center justify-center gap-4 mb-4">
          <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-400/50 to-saffron-500/30 border border-amber-300/40 shadow-lg">
            <img src="/images/swamiji1.jpg" alt="Swamiji 1" className="h-20 w-20 rounded-xl object-cover" />
          </div>
          <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-400/50 to-saffron-500/30 border border-amber-300/40 shadow-lg">
            <img src="/images/swamiji2.jpg" alt="Swamiji 2" className="h-20 w-20 rounded-xl object-cover" />
          </div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-3 text-amber-300/90 font-score text-xs tracking-[0.3em] uppercase">
          <span className="brass-divider w-12" />
          <OmSymbol size={22} className="text-amber-400" />
          Hari Prabodham Quiz Presenter
          <OmSymbol size={22} className="text-amber-400" />
          <span className="brass-divider w-12" />
        </div>
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-gradient-saffron drop-shadow-[0_4px_25px_rgba(255,107,26,0.4)]">
          {eventName}
        </h1>
        <p className="mt-2 font-body text-cream/70 text-base sm:text-lg">{subtitle}</p>
      </motion.div>

      {/* Team Score Cards */}
      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {teams.map((t, i) => (
          <GlassCard key={t.id} delay={0.1 + i * 0.08} className="p-4 text-center border border-amber-400/25">
            <div
              className="mx-auto mb-2 h-3.5 w-3.5 rounded-full"
              style={{ background: t.color, boxShadow: `0 0 14px ${t.color}` }}
            />
            <p className="font-score font-bold text-cream/90 text-sm truncate">{t.name}</p>
            <p className="mt-1 font-score text-3xl font-extrabold text-gradient-gold">{t.totalScore}</p>
            <p className="text-[11px] text-cream/40 mt-0.5 font-score">points</p>
          </GlassCard>
        ))}
      </div>

      {topTeam && topTeam.totalScore > 0 && (
        <p className="relative z-10 mb-4 text-xs sm:text-sm text-cream/60 font-body text-center">
          Leading Team: <span className="text-amber-300 font-bold">{topTeam.name}</span> · Round in progress:{' '}
          <span className="text-cream/80 capitalize font-semibold">{currentRound}</span> · Questions completed:{' '}
          <span className="text-emerald-400 font-bold">{totalCompleted} ✓</span>
        </p>
      )}

      {/* Main Actions Card */}
      <GlassCard arch className="relative z-10 w-full max-w-lg p-6 sm:p-8 flex flex-col items-center gap-4 border border-amber-400/35 shadow-[0_12px_45px_rgba(0,0,0,0.6)]" delay={0.3}>
        {!eventStarted ? (
          <button
            onClick={() => requestRound('round1', 'start')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg shadow-[0_0_35px_rgba(255,107,26,0.6)] font-bold"
          >
            <Play size={20} fill="currentColor" /> Start Event
          </button>
        ) : (
          <button
            onClick={() => {
              const target = currentRound === 'dashboard' ? 'round1' : currentRound;
              if (target === 'round1' || target === 'round2' || target === 'round3' || target === 'round4') {
                requestRound(target, 'nav');
              } else {
                sfx.click();
                goToRound(target as RoundKey);
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg shadow-[0_0_35px_rgba(255,107,26,0.6)] font-bold"
          >
            <Play size={20} fill="currentColor" /> Continue Event
          </button>
        )}

        <button
          onClick={() => setShowQRModal(true)}
          className="btn-secondary w-full flex items-center justify-center gap-2 text-xs sm:text-sm py-3 border border-amber-400/40 text-amber-300 hover:text-white font-bold"
        >
          <QrCode size={18} /> Round 3 Team Buzzer QR Code
        </button>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              sfx.click();
              toggleFullscreen();
            }}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5"
          >
            <Maximize size={16} /> Full Screen
          </button>
          <button
            onClick={() => setShowManager(true)}
            className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5"
          >
            <Settings2 size={16} /> Manage Data
          </button>
        </div>

        <div className="flex items-center gap-4 mt-1 text-xs text-cream/50">
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {teams.length} Teams
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 size={14} /> {totalCompleted} Checked
          </span>
          <button
            onClick={() => {
              if (confirm('Reset the entire event? All scores and progress will be cleared.')) {
                resetGame();
              }
            }}
            className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
          >
            <RotateCcw size={14} /> Reset Event
          </button>
        </div>
      </GlassCard>

      {/* Round Quick Navigation Bar */}
      <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2">
        {(['round1', 'round2', 'round3', 'round4'] as const).map((r, i) => (
          <button
            key={r}
            onClick={() => requestRound(r, 'nav')}
            className="px-4 py-2 rounded-full glass text-xs font-score text-cream/80 hover:text-amber-300 hover:scale-105 hover:border-amber-400/40 transition-all font-semibold"
          >
            Round {i + 1}
          </button>
        ))}
      </div>

      {showManager && <QuestionManager onClose={() => setShowManager(false)} />}
      {showQRModal && <QRCodeModal onClose={() => setShowQRModal(false)} />}
      {pending && (
        <RoundRulesModal round={pending.round} onStart={confirmPending} onClose={() => setPending(null)} />
      )}
    </div>
  );
}
