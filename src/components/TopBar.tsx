import { useState } from 'react';
import { Maximize, Minimize, HelpCircle, Flame } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import ShortcutsOverlay from './ShortcutsOverlay';
import RoundRulesModal from './RoundRulesModal';
import OmSymbol from './OmSymbol';
import { sfx } from '../utils/sound';
import type { RoundKey } from '../types';

type PlayableRound = 'round1' | 'round2' | 'round3' | 'round4';
const playableRounds: PlayableRound[] = ['round1', 'round2', 'round3', 'round4'];

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

const navItems: { id: RoundKey; label: string }[] = [
  { id: 'dashboard', label: 'Home' },
  { id: 'round1', label: 'Round 1' },
  { id: 'round2', label: 'Round 2' },
  { id: 'round3', label: 'Round 3' },
  { id: 'round4', label: 'Round 4' },
  { id: 'scoreboard', label: 'Scoreboard' },
  { id: 'settings', label: '⚙️ Settings' },
];

export default function TopBar() {
  const currentRound = useGameStore((s) => s.currentRound);
  const eventName = useGameStore((s) => s.eventName);
  const goToRound = useGameStore((s) => s.goToRound);
  const [showHelp, setShowHelp] = useState(false);
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);
  const [pendingRound, setPendingRound] = useState<PlayableRound | null>(null);

  document.onfullscreenchange = () => setIsFs(!!document.fullscreenElement);

  const navigate = (id: RoundKey) => {
    if (playableRounds.includes(id as PlayableRound)) {
      sfx.click();
      setPendingRound(id as PlayableRound);
      return;
    }
    sfx.navigate();
    goToRound(id);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[#0D0714]/85 backdrop-blur-2xl border-b border-amber-400/25 shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
        <button
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-2 font-display text-base sm:text-lg font-bold text-gradient-gold hover:opacity-90 transition-opacity shrink-0"
        >
          <Flame size={20} className="text-amber-400 fill-amber-400/30" />
          <span className="hidden sm:inline tracking-wide">{eventName}</span>
        </button>

        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-score font-bold whitespace-nowrap transition-all duration-200 ${
                currentRound === item.id
                  ? 'text-slate-950 bg-gradient-to-r from-amber-400 via-saffron-500 to-amber-500 shadow-[0_0_20px_rgba(255,167,51,0.7)] border border-amber-200 scale-105'
                  : 'text-cream/70 hover:text-cream hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <OmSymbol size={20} className="hidden lg:inline text-amber-400/80 mr-1" />
          <button
            onClick={() => setShowHelp(true)}
            className="btn-ghost p-2 rounded-xl hover:bg-white/10 text-amber-200/80 hover:text-amber-200"
            title="Keyboard shortcuts"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => {
              sfx.click();
              toggleFullscreen();
            }}
            className="btn-ghost p-2 rounded-xl hover:bg-white/10 text-amber-200/80 hover:text-amber-200"
            title="Full Screen (F)"
          >
            {isFs ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      {pendingRound && (
        <RoundRulesModal
          round={pendingRound}
          onStart={() => {
            sfx.navigate();
            goToRound(pendingRound);
            setPendingRound(null);
          }}
          onClose={() => setPendingRound(null)}
        />
      )}
    </>
  );
}
