// Cross-tab and cross-window real-time buzzer communication channel

export interface BuzzerSignal {
  type: 'BUZZ' | 'RESET' | 'LOCK' | 'SYNC';
  teamId?: string;
  teamName?: string;
  timestamp?: number;
  locked?: boolean;
}

const CHANNEL_NAME = 'gyan_quiz_buzzer_channel';
const STORAGE_KEY = 'gyan_quiz_buzzer_signal';

class BuzzerChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((signal: BuzzerSignal) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization failed, fallback to StorageEvent', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const signal: BuzzerSignal = JSON.parse(event.newValue);
            this.notifyListeners(signal);
          } catch {
            // ignore JSON errors
          }
        }
      });
    }
  }

  public send(signal: BuzzerSignal) {
    // 1. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(signal);
      } catch (e) {
        console.error('Failed to send via BroadcastChannel', e);
      }
    }

    // 2. Storage event fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...signal, _time: Date.now() }));
      } catch (e) {
        console.error('Failed to set localStorage buzzer signal', e);
      }
    }

    // 3. Local notification for current window
    this.notifyListeners(signal);
  }

  public subscribe(callback: (signal: BuzzerSignal) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(signal: BuzzerSignal) {
    this.listeners.forEach((cb) => {
      try {
        cb(signal);
      } catch (e) {
        console.error('Error in buzzer listener', e);
      }
    });
  }
}

export const buzzerChannel = new BuzzerChannelService();
