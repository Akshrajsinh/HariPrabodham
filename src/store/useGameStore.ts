import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import defaultBank from '../data/questionBank.json';
import defaultTeams from '../data/teams.json';
import { indexedDbStorage } from './indexedDbStorage';
import type { Team, RoundKey, QuestionBank, BuzzerEntry, CompletedQuestions } from '../types';

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

  // Buzzer system state
  buzzerQueue: BuzzerEntry[];
  buzzersLocked: boolean;

  // Check mark module — Completed questions tracker per round
  completedQuestions: CompletedQuestions;

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
  goToR2: (index: number) => void;
  setR2TimerDuration: (d: 30 | 45 | 60) => void;

  nextR3: () => void;
  prevR3: () => void;
  goToR3: (index: number) => void;
  revealR3: () => void;

  // Buzzer actions
  registerBuzzer: (teamId: string, customTeamName?: string) => { success: boolean; rank?: number };
  resetBuzzers: () => void;
  setBuzzerLock: (locked: boolean) => void;

  // Check Mark actions
  toggleQuestionCompleted: (round: keyof CompletedQuestions, questionId: string) => void;
  markQuestionCompleted: (round: keyof CompletedQuestions, questionId: string) => void;

  spinWheelStart: () => void;
  spinWheelStop: (topicId: string) => void;
  forceStopSpin: () => void;

  removeRound4Topic: (topicId: string) => void;

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

const initialCompleted: CompletedQuestions = {
  round1: [],
  round2: [],
  round3: [],
  round4: [],
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
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

      buzzerQueue: [],
      buzzersLocked: false,

      completedQuestions: initialCompleted,

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
      goToR2: (index) =>
        set((state) => ({
          r2Index: Math.max(0, Math.min(index, Math.max(state.bank.round2.length - 1, 0))),
        })),
      setR2TimerDuration: (d) => set({ r2TimerDuration: d, timerSecondsLeft: d }),

      nextR3: () =>
        set((state) => ({
          r3Index: Math.min(state.r3Index + 1, state.bank.round3.length - 1),
          r3Revealed: false,
          buzzerQueue: [],
        })),
      prevR3: () =>
        set((state) => ({
          r3Index: Math.max(state.r3Index - 1, 0),
          r3Revealed: false,
          buzzerQueue: [],
        })),
      goToR3: (index) =>
        set((state) => ({
          r3Index: Math.max(0, Math.min(index, Math.max(state.bank.round3.length - 1, 0))),
          r3Revealed: false,
          buzzerQueue: [],
        })),
      revealR3: () => set({ r3Revealed: true }),

      // Buzzer logic
      registerBuzzer: (teamId, customTeamName) => {
        const state = get();
        if (state.buzzersLocked) return { success: false };

        const existingIndex = state.buzzerQueue.findIndex(
          (b) => b.teamId === teamId || (customTeamName && b.teamName.toLowerCase() === customTeamName.toLowerCase())
        );

        if (existingIndex !== -1) {
          return { success: false, rank: state.buzzerQueue[existingIndex].rank };
        }

        const now = Date.now();
        const firstTime = state.buzzerQueue.length > 0 ? state.buzzerQueue[0].timestamp : now;
        const timeDiffMs = now - firstTime;
        const rank = state.buzzerQueue.length + 1;
        const teamObj = state.teams.find((t) => t.id === teamId);

        const newEntry: BuzzerEntry = {
          teamId,
          teamName: customTeamName || teamObj?.name || teamId,
          teamColor: teamObj?.color || '#FF6B1A',
          timestamp: now,
          timeDiffMs,
          rank,
        };

        set({ buzzerQueue: [...state.buzzerQueue, newEntry] });
        return { success: true, rank };
      },

      resetBuzzers: () => set({ buzzerQueue: [] }),
      setBuzzerLock: (locked) => set({ buzzersLocked: locked }),

      // Check mark module logic
      toggleQuestionCompleted: (round, questionId) =>
        set((state) => {
          const currentList = state.completedQuestions[round] || [];
          const exists = currentList.includes(questionId);
          const nextList = exists ? currentList.filter((id) => id !== questionId) : [...currentList, questionId];
          return {
            completedQuestions: {
              ...state.completedQuestions,
              [round]: nextList,
            },
          };
        }),

      markQuestionCompleted: (round, questionId) =>
        set((state) => {
          const currentList = state.completedQuestions[round] || [];
          if (currentList.includes(questionId)) return state;
          return {
            completedQuestions: {
              ...state.completedQuestions,
              [round]: [...currentList, questionId],
            },
          };
        }),

      spinWheelStart: () => set({ r4Spinning: true, r4SelectedTopicId: null }),
      spinWheelStop: (topicId) => set({ r4Spinning: false, r4SelectedTopicId: topicId }),
      forceStopSpin: () => set({ r4Spinning: false }),

      removeRound4Topic: (topicId: string) =>
        set((state) => ({
          bank: {
            ...state.bank,
            round4: state.bank.round4.filter((topic) => topic.id !== topicId),
          },
        })),

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
          buzzerQueue: [],
          buzzersLocked: false,
          completedQuestions: initialCompleted,
          r4SelectedTopicId: null,
          r4Spinning: false,
          timerRunning: false,
        }),
    }),
    {
      name: 'gyan-challenge-storage',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: (state) => {
        const { r4Spinning, timerRunning, timerSecondsLeft, r1Revealed, r3Revealed, ...rest } = state;
        return rest;
      },
    }
  )
);