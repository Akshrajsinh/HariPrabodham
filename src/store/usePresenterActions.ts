import { create } from 'zustand';

export interface PresenterActionHandlers {
  onNext?: () => void;
  onPrev?: () => void;
  onReveal?: () => void;
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  onPlayAudio?: () => void;
}

interface PresenterActionsState {
  handlers: PresenterActionHandlers;
  register: (handlers: PresenterActionHandlers) => void;
  clear: () => void;
}

export const usePresenterActions = create<PresenterActionsState>((set) => ({
  handlers: {},
  register: (handlers) => set({ handlers }),
  clear: () => set({ handlers: {} }),
}));
