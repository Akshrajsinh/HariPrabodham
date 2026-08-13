import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Smartphone, RefreshCw, Volume2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { buzzerChannel } from '../utils/buzzerChannel';
import type { BuzzerSignal } from '../utils/buzzerChannel';

import GlassCard from '../components/GlassCard';
import AmbientBackground from '../components/AmbientBackground';
import { sfx } from '../utils/sound';

export default function MobileBuzzerClient() {
  const { teams, buzzerQueue, buzzersLocked, registerBuzzer, resetBuzzers } = useGameStore();
  const [roomId, setRoomId] = useState<string>(() => buzzerChannel.getRoom());

  // Extract room ID from URL search params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        buzzerChannel.setRoom(urlRoom);
        setRoomId(urlRoom.toLowerCase());
      }
    }
  }, []);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('gyan_buzzer_team_id') : null;
  });
  const [customTeamName, setCustomTeamName] = useState<string>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('gyan_buzzer_team_name') || '' : '';
  });

  const [buzzStatus, setBuzzStatus] = useState<{
    buzzed: boolean;
    rank?: number;
    timeDiffMs?: number;
  }>({ buzzed: false });

  // Sync with global buzzer state and listener
  useEffect(() => {
    const unsub = buzzerChannel.subscribe((signal: BuzzerSignal) => {
      if (signal.type === 'RESET') {
        resetBuzzers();
        setBuzzStatus({ buzzed: false });
      }
    });
    return unsub;
  }, [resetBuzzers]);

  // Update buzz rank if registered team is in queue
  useEffect(() => {
    if (!selectedTeamId && !customTeamName) return;
    const currentTeamName = customTeamName || teams.find((t) => t.id === selectedTeamId)?.name;
    const myEntry = buzzerQueue.find(
      (b) => b.teamId === selectedTeamId || (currentTeamName && b.teamName.toLowerCase() === currentTeamName.toLowerCase())
    );

    if (myEntry) {
      setBuzzStatus({
        buzzed: true,
        rank: myEntry.rank,
        timeDiffMs: myEntry.timeDiffMs,
      });
    } else if (buzzerQueue.length === 0) {
      setBuzzStatus({ buzzed: false });
    }
  }, [buzzerQueue, selectedTeamId, customTeamName, teams]);

  const selectTeam = (teamId: string, name?: string) => {
    sfx.click();
    setSelectedTeamId(teamId);
    if (name) setCustomTeamName(name);
    localStorage.setItem('gyan_buzzer_team_id', teamId);
    if (name) localStorage.setItem('gyan_buzzer_team_name', name);
  };

  const handleBuzzerPress = () => {
    const teamObj = teams.find((t) => t.id === selectedTeamId);
    const finalTeamId = selectedTeamId || `custom-${Date.now()}`;
    const finalName = customTeamName || teamObj?.name || 'Guest Team';

    if (buzzersLocked) {
      sfx.wrong();
      return;
    }

    // Play tactile vibration if supported
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 30, 100]);
      } catch {
        // ignore
      }
    }
    sfx.fanfare();

    const timestamp = Date.now();
    const result = registerBuzzer(finalTeamId, finalName);

    // Broadcast across devices/tabs
    buzzerChannel.send({
      type: 'BUZZ',
      teamId: finalTeamId,
      teamName: finalName,
      timestamp,
      room: roomId,
    });

    if (result.rank) {
      setBuzzStatus({ buzzed: true, rank: result.rank });
    }
  };

  const currentTeamObj = teams.find((t) => t.id === selectedTeamId);
  const displayName = customTeamName || currentTeamObj?.name || 'Selected Team';
  const displayColor = currentTeamObj?.color || '#FF6B1A';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-night text-cream flex flex-col items-center justify-between p-6">
      <AmbientBackground />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-gradient-saffron">
          <Flame className="text-saffron-400" size={24} />
          Gyan Quiz Buzzer
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-score text-cream/60 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <Smartphone size={13} className="text-marigold" /> Room: <strong className="text-saffron-400 font-mono">{roomId}</strong>
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center text-center py-6">
        {!selectedTeamId && !customTeamName ? (
          <GlassCard arch glow="saffron" className="w-full p-6 space-y-5">
            <div className="text-center">
              <span className="text-xs font-score text-marigold uppercase tracking-widest block mb-1">Step 1 of 2</span>
              <h2 className="font-display text-2xl font-bold text-cream">Select Your Team</h2>
              <p className="text-xs text-cream/60 mt-1">Tap your team below to activate your phone buzzer</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTeam(t.id, t.name)}
                  className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all text-center border border-white/10"
                >
                  <div
                    className="h-4 w-4 rounded-full shadow-glow"
                    style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }}
                  />
                  <span className="font-score font-bold text-sm text-cream">{t.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-cream/50 mb-2">Or enter dynamic team name:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTeamName}
                  onChange={(e) => setCustomTeamName(e.target.value)}
                  placeholder="Team Name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream outline-none focus:border-saffron-400"
                />
                <button
                  onClick={() => {
                    if (customTeamName.trim()) selectTeam(`custom-${Date.now()}`, customTeamName.trim());
                  }}
                  disabled={!customTeamName.trim()}
                  className="btn-primary text-xs px-4 disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="w-full space-y-6 flex flex-col items-center">
            {/* Active Team Badge */}
            <div className="glass px-5 py-2.5 rounded-full flex items-center gap-3 border border-white/15">
              <div
                className="h-3.5 w-3.5 rounded-full shrink-0 shadow-glow"
                style={{ background: displayColor, boxShadow: `0 0 10px ${displayColor}` }}
              />
              <span className="font-score font-bold text-cream text-base">{displayName}</span>
              <button
                onClick={() => {
                  setSelectedTeamId(null);
                  setCustomTeamName('');
                  localStorage.removeItem('gyan_buzzer_team_id');
                  localStorage.removeItem('gyan_buzzer_team_name');
                }}
                className="text-xs text-cream/40 hover:text-cream underline ml-2"
              >
                Change
              </button>
            </div>

            {/* Huge Tactile Buzzer Button */}
            <div className="relative my-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleBuzzerPress}
                disabled={buzzersLocked || buzzStatus.buzzed}
                className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 shadow-glow flex flex-col items-center justify-center transition-all duration-300 ${
                  buzzStatus.buzzed
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.7)] cursor-default'
                    : buzzersLocked
                    ? 'bg-neutral-800 border-neutral-600 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-br from-saffron-500 via-kumkum to-saffron-700 border-marigold shadow-[0_0_60px_rgba(255,107,26,0.8)] active:shadow-[0_0_80px_rgba(255,107,26,1)]'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Flame size={48} className={buzzStatus.buzzed ? 'text-white animate-bounce' : 'text-white'} />
                  <span className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wider drop-shadow-md">
                    {buzzStatus.buzzed ? 'BUZZED!' : buzzersLocked ? 'LOCKED' : 'BUZZER'}
                  </span>
                  <span className="font-score text-xs text-white/80 uppercase tracking-widest">
                    {buzzStatus.buzzed
                      ? `RANK #${buzzStatus.rank}`
                      : buzzersLocked
                      ? 'WAIT FOR TUNE'
                      : 'TAP TO ANSWER'}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Live Status Feedback */}
            <AnimatePresence>
              {buzzStatus.buzzed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-5 rounded-2xl w-full border border-emerald/40 text-center space-y-1"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald font-score font-bold text-lg">
                    <Trophy size={20} />
                    {buzzStatus.rank === 1
                      ? 'FIRST PLACE BUZZ! 🥇'
                      : buzzStatus.rank === 2
                      ? 'SECOND PLACE BUZZ! 🥈'
                      : `RANK #${buzzStatus.rank} BUZZED!`}
                  </div>
                  <p className="text-xs text-cream/70">
                    {buzzStatus.timeDiffMs && buzzStatus.timeDiffMs > 0
                      ? `+${buzzStatus.timeDiffMs}ms behind 1st place`
                      : 'You were the fastest buzzer!'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => {
                sfx.click();
                handleBuzzerPress();
              }}
              className="text-xs text-cream/40 flex items-center gap-1.5 hover:text-cream pt-2"
            >
              <Volume2 size={14} /> Test Buzzer Sound
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center text-xs text-cream/40 border-t border-white/10 pt-3 w-full max-w-md flex items-center justify-between">
        <span>HariPrabodham Quiz · Round 3</span>
        <button
          onClick={() => {
            setBuzzStatus({ buzzed: false });
            resetBuzzers();
          }}
          className="flex items-center gap-1 hover:text-marigold"
        >
          <RefreshCw size={12} /> Reset Local
        </button>
      </div>
    </div>
  );
}
