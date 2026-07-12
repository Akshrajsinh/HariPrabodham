export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ImageQuestion {
  id: string;
  image: string;
  question: string;
  correctAnswer: string;
  points?: number;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
  image?: string;
  category?: string;
  difficulty?: Difficulty;
  points?: number;
}

export interface BhajanTrack {
  id: string;
  audioUrl: string;
  bhajanName: string;
  singer?: string;
  hint?: string;
  image?: string;
  points?: number;
}

export interface WheelTopic {
  id: string;
  label: string;
  isArrivalTopic?: boolean;
  color?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  totalScore: number;
  roundScores: {
    round1: number;
    round2: number;
    round3: number;
    round4: number;
  };
}

export type RoundKey = 'dashboard' | 'round1' | 'round2' | 'round3' | 'round4' | 'scoreboard';

export interface EventMeta {
  eventName: string;
  subtitle: string;
  currentRound: RoundKey;
  eventStarted: boolean;
}

export interface QuestionBank {
  round1: ImageQuestion[];
  round2: MCQQuestion[];
  round3: BhajanTrack[];
  round4: WheelTopic[];
}
