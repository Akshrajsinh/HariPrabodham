import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import AmbientBackground from './components/AmbientBackground';
import TopBar from './components/TopBar';
import Dashboard from './screens/Dashboard';
import Round1Picture from './screens/Round1Picture';
import Round2MCQ from './screens/Round2MCQ';
import Round3Bhajan from './screens/Round3Bhajan';
import Round4Wheel from './screens/Round4Wheel';
import Scoreboard from './screens/Scoreboard';
import MobileBuzzerClient from './screens/MobileBuzzerClient';
import SettingsView from './screens/SettingsView';

const screens = {
  dashboard: Dashboard,
  round1: Round1Picture,
  round2: Round2MCQ,
  round3: Round3Bhajan,
  round4: Round4Wheel,
  scoreboard: Scoreboard,
  buzzer: MobileBuzzerClient,
  settings: SettingsView,
};

function App() {
  useKeyboardShortcuts();
  const currentRound = useGameStore((s) => s.currentRound);

  // Check if opened via QR code URL or direct link with ?mode=buzzer, ?mode=join, or ?room=
  const isBuzzerMode = (() => {
    if (typeof window === 'undefined') return false;
    if (currentRound === 'buzzer') return true;
    const search = window.location.search;
    const hash = window.location.hash;
    const href = window.location.href;
    return (
      search.includes('mode=buzzer') ||
      search.includes('mode=join') ||
      search.includes('room=') ||
      hash.includes('mode=buzzer') ||
      hash.includes('mode=join') ||
      hash.includes('room=') ||
      href.includes('mode=buzzer') ||
      href.includes('mode=join') ||
      href.includes('room=')
    );
  })();

  if (isBuzzerMode) {
    return <MobileBuzzerClient />;
  }

  const Screen = screens[currentRound] || Dashboard;

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col bg-night text-cream">
      <AmbientBackground />
      <TopBar />
      <main className="relative z-10 flex-1 w-full pt-14 overflow-y-auto no-scrollbar flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full flex flex-col"
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

