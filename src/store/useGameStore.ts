import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import defaultBank from '../data/questionBank.json';
import defaultTeams from '../data/teams.json';
import { indexedDbStorage } from './indexedDbStorage';
import type { Team, RoundKey, QuestionBank } from '../types';

interface GameState {
  eventName: string;
  subtitle: string;
  currentRound: RoundKey;
  eventStarted: boolean;

  teams: Team[];
  bank: QuestionBank;

  // Round 1 progress — Picture Question challenge
  r1Index: number;
  r1Revealed: boolean;

  // Round 2 progress — MCQ challenge
  r2Index: number;
  r2TimerDuration: 30 | 45 | 60;

  // Round 3 progress — Bhajan Tune challenge
  r3Index: number;
  r3Revealed: boolean;

  // Round 4 progress — Spin Wheel challenge
  r4SelectedTopicId: string | null;
  r4Spinning: boolean;

  // timer shared state
  timerRunning: boolean;
  timerSecondsLeft: number;

  darkMode: boolean;

  // actions
  setEventMeta: (name: string, subtitle: string) => void;
  startEvent: () => void;
  goToRound: (round: RoundKey) => void;
  setTeams: (teams: Team[]) => void;
  awardPoints: (teamId: string, round: keyof Team['roundScores'], points: number) => void;
  setBank: (bank: QuestionBank) => void;

  nextR1: () => void;
  prevR1: () => void;
  revealR1: () => void;
  goToR1: (index: number) => void;

  nextR2: () => void;
  prevR2: () => void;
  setR2TimerDuration: (d: 30 | 45 | 60) => void;

  nextR3: () => void;
  revealR3: () => void;

  spinWheelStart: () => void;
  spinWheelStop: (topicId: string) => void;
  forceStopSpin: () => void;

  startTimer: (seconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  resetTimer: (seconds?: number) => void;

  toggleDarkMode: () => void;
  resetGame: () => void;
}

const initialTeams: Team[] = (defaultTeams as any[]).map((t) => ({
  ...t,
  totalScore: 0,
  roundScores: { round1: 0, round2: 0, round3: 0, round4: 0 },
}));

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      eventName: 'Gyan Challenge',
      subtitle: 'A Spiritual Quiz Celebration',
      currentRound: 'dashboard',
      eventStarted: false,

      teams: initialTeams,
      bank: defaultBank as unknown as QuestionBank,

      r1Index: 0,
      r1Revealed: false,

      r2Index: 0,
      r2TimerDuration: 30,

      r3Index: 0,
      r3Revealed: false,

      r4SelectedTopicId: null,
      r4Spinning: false,

      timerRunning: false,
      timerSecondsLeft: 30,

      darkMode: true,

      setEventMeta: (eventName, subtitle) => set({ eventName, subtitle }),
      startEvent: () => set({ eventStarted: true, currentRound: 'round1' }),
      goToRound: (round) => set({ currentRound: round }),
      setTeams: (teams) => set({ teams }),
      setBank: (bank) => set({ bank }),

      awardPoints: (teamId, round, points) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  totalScore: t.totalScore + points,
                  roundScores: { ...t.roundScores, [round]: t.roundScores[round] + points },
                }
              : t
          ),
        })),

      nextR1: () =>
        set((state) => ({
          r1Index: Math.min(state.r1Index + 1, Math.max(state.bank.round1.length - 1, 0)),
          r1Revealed: false,
        })),
      prevR1: () =>
        set((state) => ({
          r1Index: Math.max(state.r1Index - 1, 0),
          r1Revealed: false,
        })),
      revealR1: () => set({ r1Revealed: true }),
      goToR1: (index) =>
        set((state) => ({
          r1Index: Math.max(0, Math.min(index, Math.max(state.bank.round1.length - 1, 0))),
          r1Revealed: false,
        })),

      nextR2: () =>
        set((state) => ({
          r2Index: Math.min(state.r2Index + 1, state.bank.round2.length - 1),
        })),
      prevR2: () =>
        set((state) => ({
          r2Index: Math.max(state.r2Index - 1, 0),
        })),
      setR2TimerDuration: (d) => set({ r2TimerDuration: d, timerSecondsLeft: d }),

      nextR3: () =>
        set((state) => ({
          r3Index: Math.min(state.r3Index + 1, state.bank.round3.length - 1),
          r3Revealed: false,
        })),
      revealR3: () => set({ r3Revealed: true }),

      spinWheelStart: () => set({ r4Spinning: true, r4SelectedTopicId: null }),
      spinWheelStop: (topicId) => set({ r4Spinning: false, r4SelectedTopicId: topicId }),
      forceStopSpin: () => set({ r4Spinning: false }),

      startTimer: (seconds) => set({ timerRunning: true, timerSecondsLeft: seconds }),
      pauseTimer: () => set({ timerRunning: false }),
      resumeTimer: () => set({ timerRunning: true }),
      tickTimer: () =>
        set((state) => ({
          timerSecondsLeft: Math.max(0, state.timerSecondsLeft - 1),
          timerRunning: state.timerSecondsLeft > 0,
        })),
      resetTimer: (seconds) =>
        set((state) => ({ timerSecondsLeft: seconds ?? state.r2TimerDuration, timerRunning: false })),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      resetGame: () =>
        set({
          teams: initialTeams,
          currentRound: 'dashboard',
          eventStarted: false,
          r1Index: 0,
          r1Revealed: false,
          r2Index: 0,
          r3Index: 0,
          r3Revealed: false,
          r4SelectedTopicId: null,
          r4Spinning: false,
          timerRunning: false,
        }),
    }),
    {
      name: 'gyan-challenge-storage',
      // IndexedDB rather than the default localStorage — localStorage's
      // ~5-10MB per-origin quota was silently failing to save once bhajan
      // audio clips and picture-question images pushed the persisted
      // state past it, which is why newly added content could disappear
      // on refresh. IndexedDB's quota is far larger.
      storage: createJSONStorage(() => indexedDbStorage),
      // These are transient, moment-to-moment UI flags — not something we ever
      // want frozen into storage. If the page reloads mid-spin or mid-timer
      // (e.g. a presenter accidentally refreshes), persisting these would leave
      // the spin wheel or countdown permanently "stuck" on the next load.
      partialize: (state) => {
        const { r4Spinning, timerRunning, timerSecondsLeft, r1Revealed, r3Revealed, ...rest } = state;
        return rest;
      },
    }
  )
);
