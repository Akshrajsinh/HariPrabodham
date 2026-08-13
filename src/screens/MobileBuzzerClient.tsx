import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, RefreshCw, Volume2, KeyRound, ArrowRight } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { buzzerChannel } from '../utils/buzzerChannel';
import type { BuzzerSignal } from '../utils/buzzerChannel';

import GlassCard from '../components/GlassCard';
import AmbientBackground from '../components/AmbientBackground';
import { sfx } from '../utils/sound';

export default function MobileBuzzerClient() {
  const { teams, buzzerQueue, buzzersLocked, registerBuzzer, resetBuzzers, setBuzzerLock } = useGameStore();

  // 6-Digit Room Code State
  const [inputRoomCode, setInputRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) return urlRoom.trim().toUpperCase();
      if (window.location.hash.includes('room=')) {
        const match = window.location.hash.match(/room=([^&]+)/);
        if (match) return decodeURIComponent(match[1]).trim().toUpperCase();
      }
    }
    return buzzerChannel.getRoom().toUpperCase();
  });

  const [joinedRoom, setJoinedRoom] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        buzzerChannel.setRoom(urlRoom);
        return urlRoom.trim().toUpperCase();
      }
      // Check if user already joined room previously in localStorage
      const savedRoom = localStorage.getItem('gyan_buzzer_joined_room');
      if (savedRoom) {
        buzzerChannel.setRoom(savedRoom);
        return savedRoom.trim().toUpperCase();
      }
    }
    return null;
  });

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

  // Sync room ID on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        const cleanRoom = urlRoom.trim().toUpperCase();
        buzzerChannel.setRoom(cleanRoom);
        setInputRoomCode(cleanRoom);
        setJoinedRoom(cleanRoom);
        localStorage.setItem('gyan_buzzer_joined_room', cleanRoom);
      }
    }
  }, []);

  // Real-time listener for signals
  useEffect(() => {
    const unsub = buzzerChannel.subscribe((signal: BuzzerSignal) => {
      if (signal.type === 'SYNC') {
        if (signal.queue !== undefined) {
          useGameStore.setState({ buzzerQueue: signal.queue });
        }
        if (signal.locked !== undefined) {
          useGameStore.setState({ buzzersLocked: signal.locked });
        }
      } else if (signal.type === 'RESET') {
        resetBuzzers();
        setBuzzStatus({ buzzed: false });
      } else if (signal.type === 'LOCK' && signal.locked !== undefined) {
        setBuzzerLock(signal.locked);
      }
    });

    if (joinedRoom && (selectedTeamId || customTeamName)) {
      const currentTeamName = customTeamName || teams.find((t) => t.id === selectedTeamId)?.name;
      buzzerChannel.send({
        type: 'JOIN',
        teamId: selectedTeamId || `custom-${Date.now()}`,
        teamName: currentTeamName,
        room: joinedRoom,
      });
    }

    return unsub;
  }, [resetBuzzers, setBuzzerLock, selectedTeamId, customTeamName, joinedRoom, teams]);

  // Update buzz rank if registered team is in queue
  useEffect(() => {
    if (!selectedTeamId && !customTeamName) {
      setBuzzStatus({ buzzed: false });
      return;
    }
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
    } else {
      setBuzzStatus({ buzzed: false });
    }
  }, [buzzerQueue, selectedTeamId, customTeamName, teams]);

  const handleJoinRoomAndTeam = (teamId?: string, teamName?: string) => {
    const code = inputRoomCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      alert('Please enter a valid 6-digit room code!');
      return;
    }

    const tId = teamId || selectedTeamId || `custom-${Date.now()}`;
    const tName = teamName || customTeamName || teams.find((t) => t.id === tId)?.name || 'Guest Team';

    sfx.click();
    buzzerChannel.setRoom(code);
    setJoinedRoom(code);
    setSelectedTeamId(tId);
    setCustomTeamName(tName);

    localStorage.setItem('gyan_buzzer_joined_room', code);
    localStorage.setItem('gyan_buzzer_team_id', tId);
    localStorage.setItem('gyan_buzzer_team_name', tName);

    buzzerChannel.send({
      type: 'JOIN',
      teamId: tId,
      teamName: tName,
      room: code,
    });
  };

  const handleBuzzerPress = () => {
    const teamObj = teams.find((t) => t.id === selectedTeamId);
    const finalTeamId = selectedTeamId || `custom-${Date.now()}`;
    const finalName = customTeamName || teamObj?.name || 'Guest Team';

    if (buzzersLocked) {
      sfx.wrong();
      return;
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 30, 100]);
      } catch {}
    }
    sfx.fanfare();

    const timestamp = Date.now();
    const result = registerBuzzer(finalTeamId, finalName);

    buzzerChannel.send({
      type: 'BUZZ',
      teamId: finalTeamId,
      teamName: finalName,
      timestamp,
      room: joinedRoom || inputRoomCode,
    });

    if (result.rank) {
      setBuzzStatus({ buzzed: true, rank: result.rank });
    }
  };

  const currentTeamObj = teams.find((t) => t.id === selectedTeamId);
  const displayName = customTeamName || currentTeamObj?.name || 'Selected Team';
  const displayColor = currentTeamObj?.color || '#FF6B1A';

  const isJoined = Boolean(joinedRoom && (selectedTeamId || customTeamName));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-night text-cream flex flex-col items-center justify-between p-4 sm:p-6">
      <AmbientBackground />

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-gradient-saffron">
          <Flame className="text-saffron-400" size={24} />
          Gyan Quiz Buzzer
        </div>
        {isJoined && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-score text-cream/70 uppercase tracking-widest flex items-center gap-1.5 bg-saffron-950/80 px-3 py-1 rounded-full border border-saffron-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Room: <strong className="text-saffron-300 font-mono font-bold">{joinedRoom}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="relative z-10 w-full max-w-md my-auto flex flex-col items-center text-center py-4">
        {!isJoined ? (
          /* STEP 1: BuzzLive Style 6-Digit Room & Team Join Page */
          <GlassCard arch glow="saffron" className="w-full p-6 space-y-5 border-2 border-saffron-500/40 shadow-[0_0_40px_rgba(255,107,26,0.3)]">
            <div className="text-center">
              <span className="text-xs font-score text-marigold uppercase tracking-widest block mb-1">
                Enter Room Code
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-cream">
                Join Live Quiz
              </h2>
              <p className="text-xs text-cream/60 mt-1">
                Type the 6-digit room code from host screen & select your team
              </p>
            </div>

            {/* 6-Digit Code Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-score text-saffron-300 uppercase tracking-wider block text-left">
                6-Digit Room Code:
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 482910"
                  className="w-full bg-black/80 border-2 border-saffron-400 rounded-2xl py-3 px-4 text-center font-mono font-black text-2xl tracking-[0.25em] text-saffron-300 outline-none focus:ring-4 focus:ring-saffron-500/40 shadow-inner uppercase"
                />
                <KeyRound size={18} className="absolute right-4 top-4 text-saffron-400/60" />
              </div>
            </div>

            {/* Team Selection */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-score text-saffron-300 uppercase tracking-wider block text-left">
                Select Your Team:
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeamId(t.id);
                      setCustomTeamName(t.name);
                    }}
                    className={`p-3.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center border ${
                      selectedTeamId === t.id
                        ? 'bg-saffron-500/20 border-saffron-400 shadow-[0_0_20px_rgba(255,145,0,0.4)] scale-105'
                        : 'glass hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full shadow-glow"
                      style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }}
                    />
                    <span className="font-score font-bold text-xs text-cream">{t.name}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  value={customTeamName}
                  onChange={(e) => {
                    setCustomTeamName(e.target.value);
                    setSelectedTeamId(null);
                  }}
                  placeholder="Or custom team name..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-cream outline-none focus:border-saffron-400"
                />
              </div>
            </div>

            {/* Big Join Button */}
            <button
              onClick={() => handleJoinRoomAndTeam()}
              disabled={!inputRoomCode.trim() || (!selectedTeamId && !customTeamName.trim())}
              className="btn-primary w-full py-3.5 text-sm font-score font-black flex items-center justify-center gap-2 rounded-2xl shadow-[0_0_30px_rgba(255,107,26,0.8)] disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              <span>JOIN BUZZER ROOM</span>
              <ArrowRight size={18} />
            </button>
          </GlassCard>
        ) : (
          /* STEP 2: Active Tactile Buzzer View */
          <div className="w-full space-y-5 flex flex-col items-center">
            {/* Active Team Badge */}
            <div className="glass px-5 py-2.5 rounded-full flex items-center gap-3 border border-saffron-500/30 bg-saffron-950/40 shadow-md">
              <div
                className="h-3.5 w-3.5 rounded-full shrink-0 shadow-glow"
                style={{ background: displayColor, boxShadow: `0 0 10px ${displayColor}` }}
              />
              <span className="font-score font-bold text-cream text-base">{displayName}</span>
              <button
                onClick={() => {
                  setJoinedRoom(null);
                  localStorage.removeItem('gyan_buzzer_joined_room');
                }}
                className="text-xs text-saffron-300 hover:text-white underline ml-2 font-mono"
              >
                Change Code / Team
              </button>
            </div>

            {/* Huge Tactile Buzzer Button */}
            <div className="relative my-3">
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
                  className="glass p-4 rounded-2xl w-full border border-emerald-500/40 text-center space-y-1 bg-emerald-950/30"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-score font-bold text-lg">
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
              className="text-xs text-cream/50 flex items-center gap-1.5 hover:text-cream pt-1"
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
