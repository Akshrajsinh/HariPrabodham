// Real-time cross-tab and cross-device buzzer communication channel

export interface BuzzerSignal {
  type: 'BUZZ' | 'RESET' | 'LOCK' | 'SYNC';
  teamId?: string;
  teamName?: string;
  timestamp?: number;
  locked?: boolean;
  room?: string;
}

const CHANNEL_NAME = 'gyan_quiz_buzzer_channel';
const STORAGE_KEY = 'gyan_quiz_buzzer_signal';

// Default global room code for current event session
export function getActiveRoomId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) return roomParam.trim().toLowerCase();
    const stored = localStorage.getItem('gyan_quiz_room_id');
    if (stored) return stored.trim().toLowerCase();
  }
  return 'gyan-quiz';
}

export function setActiveRoomId(room: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gyan_quiz_room_id', room.trim().toLowerCase());
  }
}

class BuzzerChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((signal: BuzzerSignal) => void)[] = [];
  private ws: WebSocket | null = null;
  private roomId: string = getActiveRoomId();
  private wsConnected: boolean = false;
  private reconnectTimer: any = null;

  constructor() {
    // 1. Initialize BroadcastChannel (Same-device cross-tab)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && this.isMatchingRoom(event.data)) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization failed, fallback to StorageEvent', e);
      }
    }

    // 2. Initialize localStorage listener (Same-device fallback)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const signal: BuzzerSignal = JSON.parse(event.newValue);
            if (this.isMatchingRoom(signal)) {
              this.notifyListeners(signal);
            }
          } catch {
            // ignore JSON errors
          }
        }
      });
    }

    // 3. Connect to Cross-Device WebSocket Relay for Deployed/Network operation
    this.connectWebSocket();
  }

  public setRoom(room: string) {
    this.roomId = room.trim().toLowerCase();
    setActiveRoomId(this.roomId);
    this.reconnectWebSocket();
  }

  public getRoom(): string {
    return this.roomId;
  }

  public isWsConnected(): boolean {
    return this.wsConnected;
  }

  private isMatchingRoom(signal: BuzzerSignal): boolean {
    if (!signal.room) return true;
    return signal.room.trim().toLowerCase() === this.roomId;
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      // Public WebSocket relay endpoint using room channel
      const wsUrl = `wss://socketsbay.com/wss/v2/1/${encodeURIComponent(this.roomId)}/`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.wsConnected = true;
        console.log('[BuzzerChannel] Connected to multi-device network relay for room:', this.roomId);
      };

      this.ws.onmessage = (event) => {
        try {
          const signal: BuzzerSignal = JSON.parse(event.data);
          if (this.isMatchingRoom(signal)) {
            // Avoid loopback duplicate triggering if timestamp matches
            this.notifyListeners(signal);
          }
        } catch {
          // ignore non-json messages
        }
      };

      this.ws.onerror = () => {
        this.wsConnected = false;
      };

      this.ws.onclose = () => {
        this.wsConnected = false;
        // Schedule auto-reconnect after 3 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
      };
    } catch {
      this.wsConnected = false;
    }
  }

  private reconnectWebSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.connectWebSocket();
  }

  public send(signal: BuzzerSignal) {
    const payload: BuzzerSignal = { ...signal, room: this.roomId, timestamp: signal.timestamp || Date.now() };

    // 1. BroadcastChannel (local browser tabs)
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.error('Failed to send via BroadcastChannel', e);
      }
    }

    // 2. Storage event fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, _time: Date.now() }));
      } catch (e) {
        console.error('Failed to set localStorage buzzer signal', e);
      }
    }

    // 3. Network WebSocket relay for deployed cross-device scanning
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to send signal over WebSocket network relay', e);
      }
    }

    // 4. Local notification for current window
    this.notifyListeners(payload);
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
