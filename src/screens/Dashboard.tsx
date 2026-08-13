import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Maximize, Settings, QrCode, Trophy, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import MandalaRing from '../components/MandalaRing';
import SwaminarayanTilakIcon from '../components/SwaminarayanTilakIcon';
import RoundRulesModal from '../components/RoundRulesModal';
import QRCodeModal from '../components/QRCodeModal';
import { sfx } from '../utils/sound';

type PlayableRound = 'round1' | 'round2' | 'round3' | 'round4';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

export default function Dashboard() {
  const { eventStarted, currentRound, teams, startEvent, goToRound, completedQuestions } =
    useGameStore();
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
        <MandalaRing size={720} />
      </div>

      {/* 4 Divine Guru Angled Shrine Cards (Surrounding Poster Layout) */}

      {/* Top-Left Angled Shrine: Harikrishna Maharaj (-6deg) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
        animate={{ opacity: 1, scale: 1, rotate: -6 }}
        whileHover={{ scale: 1.1, rotate: 0, zIndex: 40 }}
        className="hidden lg:flex flex-col items-center absolute left-4 top-14 z-20 cursor-pointer transition-all"
      >
        <div className="p-1.5 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_35px_rgba(255,167,51,0.6)]">
          <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/30">
            <img src="/images/guru1.jpg" alt="Harikrishna Maharaj" className="w-full h-full object-cover shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-[10px] font-score font-extrabold text-amber-200 text-center drop-shadow-md">
                શ્રી હરિકૃષ્ણ મહારાજ
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top-Right Angled Shrine: Gunatitanand Swami (+6deg) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
        animate={{ opacity: 1, scale: 1, rotate: 6 }}
        whileHover={{ scale: 1.1, rotate: 0, zIndex: 40 }}
        className="hidden lg:flex flex-col items-center absolute right-4 top-14 z-20 cursor-pointer transition-all"
      >
        <div className="p-1.5 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_35px_rgba(255,167,51,0.6)]">
          <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/30">
            <img src="/images/guru2.jpg" alt="Gunatitanand Swami" className="w-full h-full object-cover shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-[10px] font-score font-extrabold text-amber-200 text-center drop-shadow-md">
                ગુણાતીતાનંદ સ્વામી
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom-Left Angled Shrine: Shastriji Maharaj (-4deg) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: -4 }}
        whileHover={{ scale: 1.1, rotate: 0, zIndex: 40 }}
        className="hidden lg:flex flex-col items-center absolute left-4 bottom-10 z-20 cursor-pointer transition-all"
      >
        <div className="p-1.5 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_35px_rgba(255,167,51,0.6)]">
          <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/30">
            <img src="/images/guru3.jpg" alt="Shastriji Maharaj" className="w-full h-full object-cover shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-[10px] font-score font-extrabold text-amber-200 text-center drop-shadow-md">
                શાસ્ત્રીજી મહારાજ
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom-Right Angled Shrine: Yogiji Maharaj (+4deg) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 12 }}
        animate={{ opacity: 1, scale: 1, rotate: 4 }}
        whileHover={{ scale: 1.1, rotate: 0, zIndex: 40 }}
        className="hidden lg:flex flex-col items-center absolute right-4 bottom-10 z-20 cursor-pointer transition-all"
      >
        <div className="p-1.5 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_35px_rgba(255,167,51,0.6)]">
          <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/30">
            <img src="/images/guru4.jpg" alt="Yogiji Maharaj" className="w-full h-full object-cover shadow-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end justify-center p-2">
              <span className="text-[10px] font-score font-extrabold text-amber-200 text-center drop-shadow-md">
                યોગીજી મહારાજ
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Center Poster Container */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center mb-4 max-w-3xl"
      >
        {/* Mobile Inline 4 Guru Portraits (Visible below LG screens) */}
        <div className="flex lg:hidden flex-wrap items-center justify-center gap-3 mb-4">
          <div className="p-1 rounded-2xl bg-amber-400/50 border border-amber-300 -rotate-3">
            <img src="/images/guru1.jpg" alt="Guru 1" className="h-16 w-16 rounded-xl object-cover" />
          </div>
          <div className="p-1 rounded-2xl bg-amber-400/50 border border-amber-300 rotate-3">
            <img src="/images/guru2.jpg" alt="Guru 2" className="h-16 w-16 rounded-xl object-cover" />
          </div>
          <div className="p-1 rounded-2xl bg-amber-400/50 border border-amber-300 -rotate-3">
            <img src="/images/guru3.jpg" alt="Guru 3" className="h-16 w-16 rounded-xl object-cover" />
          </div>
          <div className="p-1 rounded-2xl bg-amber-400/50 border border-amber-300 rotate-3">
            <img src="/images/guru4.jpg" alt="Guru 4" className="h-16 w-16 rounded-xl object-cover" />
          </div>
        </div>

        {/* Top Swaminarayan Tilak Emblem Badge */}
        <div className="flex items-center justify-center mb-3">
          <div className="h-16 w-16 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_35px_rgba(255,167,51,0.9)] flex items-center justify-center p-1.5">
            <SwaminarayanTilakIcon size={42} />
          </div>
        </div>

        <div className="mb-2 flex items-center justify-center gap-3 text-amber-300/90 font-score text-xs sm:text-sm tracking-[0.25em] uppercase font-extrabold">
          <span className="brass-divider w-12 sm:w-20" />
          <span className="text-amber-400">⚜ 卐</span>
          HARI PRABODHAM
          <span className="text-amber-400">⚜</span>
          <span className="brass-divider w-12 sm:w-20" />
        </div>

        {/* Grand Poster Main Title */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black text-gradient-gold drop-shadow-[0_4px_35px_rgba(255,167,51,0.6)]">
          Hari Prabodham Quiz
        </h1>
        <p className="mt-2 font-display text-2xl sm:text-3xl text-amber-200 font-extrabold">
          હરિપ્રબોધમ જ્ઞાન કસોટી
        </p>
      </motion.div>

      {/* Team Score Bar */}
      <div className="relative z-10 grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {teams.map((t, i) => (
          <GlassCard key={t.id} delay={0.1 + i * 0.08} className="p-3 text-center border-2 border-amber-400/40 bg-black/60">
            <div
              className="mx-auto mb-1.5 h-3.5 w-3.5 rounded-full"
              style={{ background: t.color, boxShadow: `0 0 14px ${t.color}` }}
            />
            <p className="font-score font-extrabold text-white text-xs sm:text-sm truncate">{t.name}</p>
            <p className="mt-0.5 font-score text-2xl sm:text-3xl font-black text-gradient-gold">{t.totalScore}</p>
          </GlassCard>
        ))}
      </div>

      {topTeam && topTeam.totalScore > 0 && (
        <p className="relative z-10 mb-5 text-xs sm:text-sm text-amber-200/80 font-score font-bold text-center">
          🏆 Leading Team: <span className="text-amber-300 font-extrabold">{topTeam.name}</span> · Questions Completed:{' '}
          <span className="text-emerald-400 font-extrabold">{totalCompleted} ✓</span>
        </p>
      )}

      {/* Clean Poster Launcher Actions (All Round details removed!) */}
      <GlassCard arch className="relative z-10 w-full max-w-lg p-6 sm:p-7 flex flex-col items-center gap-4 border-2 border-amber-400/40 shadow-[0_12px_45px_rgba(0,0,0,0.8)]" delay={0.3}>
        {!eventStarted ? (
          <button
            onClick={() => requestRound('round1', 'start')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg sm:text-xl py-3.5 shadow-[0_0_40px_rgba(255,107,26,0.9)] font-black"
          >
            <Play size={22} fill="currentColor" /> Start Hari Prabodham Quiz
          </button>
        ) : (
          <button
            onClick={() => {
              const target = currentRound === 'dashboard' ? 'round1' : currentRound;
              if (target === 'round1' || target === 'round2' || target === 'round3' || target === 'round4') {
                requestRound(target, 'nav');
              } else {
                sfx.click();
                goToRound(target);
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg sm:text-xl py-3.5 shadow-[0_0_40px_rgba(255,107,26,0.9)] font-black"
          >
            <Play size={22} fill="currentColor" /> Continue Event
          </button>
        )}

        {/* Clean Poster Round Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full pt-1">
          <button
            onClick={() => requestRound('round1', 'nav')}
            className="btn-secondary py-2.5 px-2 text-xs font-score font-extrabold flex flex-col items-center gap-1 border-amber-400/40"
          >
            <Sparkles size={16} className="text-amber-400" /> Round 1
          </button>
          <button
            onClick={() => requestRound('round2', 'nav')}
            className="btn-secondary py-2.5 px-2 text-xs font-score font-extrabold flex flex-col items-center gap-1 border-amber-400/40"
          >
            <Sparkles size={16} className="text-amber-400" /> Round 2
          </button>
          <button
            onClick={() => requestRound('round3', 'nav')}
            className="btn-secondary py-2.5 px-2 text-xs font-score font-extrabold flex flex-col items-center gap-1 border-amber-400/40"
          >
            <Sparkles size={16} className="text-amber-400" /> Round 3
          </button>
          <button
            onClick={() => requestRound('round4', 'nav')}
            className="btn-secondary py-2.5 px-2 text-xs font-score font-extrabold flex flex-col items-center gap-1 border-amber-400/40"
          >
            <Sparkles size={16} className="text-amber-400" /> Round 4
          </button>
        </div>

        {/* Bottom Utility Controls */}
        <div className="grid grid-cols-3 gap-2.5 w-full pt-1">
          <button
            onClick={() => {
              sfx.click();
              goToRound('scoreboard');
            }}
            className="btn-secondary text-xs py-2.5 font-extrabold flex items-center justify-center gap-1 border-amber-400/40"
          >
            <Trophy size={14} /> Scoreboard
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="btn-secondary text-xs py-2.5 font-extrabold flex items-center justify-center gap-1 border-amber-400/40 text-amber-300"
          >
            <QrCode size={14} /> Buzzer QR
          </button>

          <button
            onClick={() => {
              sfx.click();
              goToRound('settings');
            }}
            className="btn-secondary text-xs py-2.5 font-extrabold flex items-center justify-center gap-1 border-amber-400/40"
          >
            <Settings size={14} /> Settings
          </button>
        </div>

        <button
          onClick={() => {
            sfx.click();
            toggleFullscreen();
          }}
          className="text-xs font-score text-amber-200/70 hover:text-white flex items-center gap-1 font-bold pt-1"
        >
          <Maximize size={14} /> Toggle Fullscreen Display
        </button>
      </GlassCard>

      {showQRModal && <QRCodeModal onClose={() => setShowQRModal(false)} />}
      {pending && (
        <RoundRulesModal round={pending.round} onStart={confirmPending} onClose={() => setPending(null)} />
      )}
    </div>
  );
}
