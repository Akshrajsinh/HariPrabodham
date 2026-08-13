import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Hash, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import MandalaRing from '../components/MandalaRing';
import SwaminarayanTilakIcon from '../components/SwaminarayanTilakIcon';
import RoundRulesModal from '../components/RoundRulesModal';
import RoomInfoModal from '../components/RoomInfoModal';
import { sfx } from '../utils/sound';

type PlayableRound = 'round1' | 'round2' | 'round3' | 'round4';

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

  const leftGurus = [
    { id: 'guru1', name: 'શ્રી સ્વામિનારાયણ ભગવાન', img: '/images/guru1.jpg', rotate: -8 },
    { id: 'guru3', name: 'શાસ્ત્રીજી મહારાજ', img: '/images/guru3.jpg', rotate: -5 },
    { id: 'swamiji1', name: 'હરિપ્રસાદ સ્વામીજી', img: '/images/swamiji1.jpg', rotate: -8 },
  ];

  const rightGurus = [
    { id: 'guru2', name: 'ગુણાતીતાનંદ સ્વામી', img: '/images/guru2.jpg', rotate: 8 },
    { id: 'guru4', name: 'યોગીજી મહારાજ', img: '/images/guru4.jpg', rotate: 5 },
    { id: 'swamiji2', name: 'પ્રબોધ સ્વામીજી', img: '/images/swamiji2.jpg', rotate: 8 },
  ];

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-3.5rem)] flex flex-col items-center justify-between p-3 sm:p-5 max-w-7xl mx-auto overflow-hidden">
      {/* Background Sacred Mandala */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25">
        <MandalaRing size={680} />
      </div>

      {/* LEFT SIDE (3 Divine Guru Portraits) - Visible on XL Screens */}
      <div className="hidden xl:flex flex-col items-center gap-4 absolute left-4 top-1/2 -translate-y-1/2 z-20">
        {leftGurus.map((g) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, x: -50, rotate: g.rotate }}
            animate={{ opacity: 1, x: 0, rotate: g.rotate }}
            whileHover={{ scale: 1.15, rotate: 0, x: 10, zIndex: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="cursor-pointer transition-all"
          >
            <div className="p-1 sm:p-1.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_25px_rgba(255,167,51,0.6)]">
              <div className="relative w-28 h-34 lg:w-32 lg:h-38 rounded-xl overflow-hidden bg-black/60 border border-white/30">
                <img src={g.img} alt={g.name} className="w-full h-full object-cover shadow-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center p-1">
                  <span className="text-[10px] lg:text-[11px] font-score font-extrabold text-amber-200 text-center drop-shadow-md leading-tight">
                    {g.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* RIGHT SIDE (3 Divine Guru Portraits) - Visible on XL Screens */}
      <div className="hidden xl:flex flex-col items-center gap-4 absolute right-4 top-1/2 -translate-y-1/2 z-20">
        {rightGurus.map((g) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, x: 50, rotate: g.rotate }}
            animate={{ opacity: 1, x: 0, rotate: g.rotate }}
            whileHover={{ scale: 1.15, rotate: 0, x: -10, zIndex: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="cursor-pointer transition-all"
          >
            <div className="p-1 sm:p-1.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_25px_rgba(255,167,51,0.6)]">
              <div className="relative w-28 h-34 lg:w-32 lg:h-38 rounded-xl overflow-hidden bg-black/60 border border-white/30">
                <img src={g.img} alt={g.name} className="w-full h-full object-cover shadow-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center p-1">
                  <span className="text-[10px] lg:text-[11px] font-score font-extrabold text-amber-200 text-center drop-shadow-md leading-tight">
                    {g.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile / Tablet 6 Guru Portraits Top Row (Visible below XL screens) */}
      <div className="flex xl:hidden flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
        {[...leftGurus, ...rightGurus].map((g) => (
          <motion.div
            key={g.id}
            whileHover={{ scale: 1.1, rotate: 0 }}
            className="cursor-pointer transition-all"
            style={{ transform: `rotate(${g.rotate}deg)` }}
          >
            <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-600 border border-white shadow-md">
              <div className="relative w-18 h-22 sm:w-24 sm:h-30 rounded-xl overflow-hidden bg-black/60">
                <img src={g.img} alt={g.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center p-1">
                  <span className="text-[9px] font-score font-extrabold text-amber-200 text-center leading-tight">
                    {g.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Center Poster Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center my-auto max-w-2xl"
      >
        {/* Top Swaminarayan Tilak Emblem */}
        <div className="flex items-center justify-center mb-3">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-white shadow-[0_0_40px_rgba(255,167,51,0.9)] flex items-center justify-center p-2">
            <SwaminarayanTilakIcon size={46} />
          </div>
        </div>

        <div className="mb-2 flex items-center justify-center gap-3 text-amber-300/90 font-score text-xs sm:text-sm tracking-[0.25em] uppercase font-extrabold">
          <span className="brass-divider w-10 sm:w-20" />
          <span className="text-amber-400">⚜ 卐</span>
          HARI PRABODHAM
          <span className="text-amber-400">⚜</span>
          <span className="brass-divider w-10 sm:w-20" />
        </div>

        {/* Grand Main Title */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black text-gradient-gold drop-shadow-[0_4px_40px_rgba(255,167,51,0.6)]">
          Hari Prabodham Quiz
        </h1>
        <p className="mt-1 font-display text-2xl sm:text-4xl text-amber-200 font-extrabold">
          હરિપ્રબોધમ જ્ઞાન કસોટી
        </p>
      </motion.div>

      {/* Team Score Cards Bar */}
      <div className="relative z-10 grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
        {teams.map((t, i) => (
          <GlassCard key={t.id} delay={0.1 + i * 0.08} className="p-2.5 sm:p-3 text-center border-2 border-amber-400/40 bg-black/60">
            <div
              className="mx-auto mb-1 h-3 w-3 rounded-full"
              style={{ background: t.color, boxShadow: `0 0 14px ${t.color}` }}
            />
            <p className="font-score font-extrabold text-white text-xs sm:text-sm truncate">{t.name}</p>
            <p className="mt-0.5 font-score text-xl sm:text-3xl font-black text-gradient-gold">{t.totalScore}</p>
          </GlassCard>
        ))}
      </div>

      {topTeam && topTeam.totalScore > 0 && (
        <p className="relative z-10 mb-2 text-xs text-amber-200/80 font-score font-bold text-center">
          🏆 Leading Team: <span className="text-amber-300 font-extrabold">{topTeam.name}</span> · Questions Completed:{' '}
          <span className="text-emerald-400 font-extrabold">{totalCompleted} ✓</span>
        </p>
      )}

      {/* Clean Poster Actions */}
      <GlassCard arch className="relative z-10 w-full max-w-md p-4 sm:p-5 flex flex-col items-center gap-3 border-2 border-amber-400/40 shadow-[0_12px_45px_rgba(0,0,0,0.8)] mb-2" delay={0.2}>
        {!eventStarted ? (
          <button
            onClick={() => {
              sfx.click();
              setPending({ round: 'round1', kind: 'start' });
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base sm:text-lg py-3.5 shadow-[0_0_40px_rgba(255,107,26,0.9)] font-black"
          >
            <Play size={22} fill="currentColor" /> Start Hari Prabodham Quiz
          </button>
        ) : (
          <button
            onClick={() => {
              const target = currentRound === 'dashboard' ? 'round1' : currentRound;
              if (target === 'round1' || target === 'round2' || target === 'round3' || target === 'round4') {
                sfx.click();
                setPending({ round: target, kind: 'nav' });
              } else {
                sfx.click();
                goToRound(target);
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base sm:text-lg py-3.5 shadow-[0_0_40px_rgba(255,107,26,0.9)] font-black"
          >
            <Play size={22} fill="currentColor" /> Continue Event
          </button>
        )}

        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => setShowQRModal(true)}
            className="btn-secondary text-xs py-2.5 font-extrabold flex items-center justify-center gap-1.5 border-amber-400/40 text-amber-300"
          >
            <Hash size={16} /> Buzzer Room Code
          </button>

          <button
            onClick={() => {
              sfx.click();
              goToRound('scoreboard');
            }}
            className="btn-secondary text-xs py-2.5 font-extrabold flex items-center justify-center gap-1.5 border-amber-400/40"
          >
            <Trophy size={16} /> Scoreboard
          </button>
        </div>
      </GlassCard>

      {showQRModal && <RoomInfoModal onClose={() => setShowQRModal(false)} />}
      {pending && (
        <RoundRulesModal round={pending.round} onStart={confirmPending} onClose={() => setPending(null)} />
      )}
    </div>
  );
}
