// Real-time cross-tab, cross-device, and cross-network buzzer communication channel
// Uses multi-transport pub/sub: ntfy.sh SSE + WebSocket + BroadcastChannel + localStorage

export interface BuzzerSignal {
  type: 'BUZZ' | 'RESET' | 'LOCK' | 'SYNC' | 'JOIN';
  senderId?: string;
  teamId?: string;
  teamName?: string;
  timestamp?: number;
  locked?: boolean;
  room?: string;
  queue?: any[];
}

const CHANNEL_NAME = 'gyan_quiz_buzzer_channel';
const STORAGE_KEY = 'gyan_quiz_buzzer_signal';
const CLIENT_ID =
  typeof window !== 'undefined'
    ? Math.random().toString(36).substring(2, 9)
    : 'server';

export function generate6DigitRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getActiveRoomId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) return roomParam.trim().toLowerCase();

    // Check hash params as well
    if (window.location.hash.includes('room=')) {
      const match = window.location.hash.match(/room=([^&]+)/);
      if (match) return decodeURIComponent(match[1]).trim().toLowerCase();
    }

    const stored = localStorage.getItem('gyan_quiz_room_id');
    if (stored && stored.trim().length >= 4) return stored.trim().toLowerCase();

    const newCode = generate6DigitRoomCode();
    localStorage.setItem('gyan_quiz_room_id', newCode);
    return newCode;
  }
  return '482910';
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
  private eventSource: EventSource | null = null;
  private roomId: string = getActiveRoomId();
  private isConnected: boolean = false;
  private processedSignals = new Set<string>();

  constructor() {
    this.initLocalTransports();
    this.connectRealtimeRelay();
  }

  public setRoom(room: string) {
    const newRoom = room.trim().toLowerCase();
    if (this.roomId === newRoom) return;
    this.roomId = newRoom;
    setActiveRoomId(this.roomId);
    this.reconnectRealtimeRelay();
  }

  public createNewRoomCode(): string {
    const newCode = generate6DigitRoomCode();
    this.setRoom(newCode);
    return newCode;
  }

  public getRoom(): string {
    return this.roomId;
  }

  public isLiveConnected(): boolean {
    return this.isConnected;
  }

  private isMatchingRoom(signal: BuzzerSignal): boolean {
    if (!signal.room) return true;
    return signal.room.trim().toLowerCase() === this.roomId;
  }

  private handleIncomingSignal(signal: BuzzerSignal) {
    if (!this.isMatchingRoom(signal)) return;
    if (signal.senderId === CLIENT_ID) return;

    // Deduplication check
    const sigKey = `${signal.senderId}_${signal.type}_${signal.timestamp || 0}_${signal.teamId || ''}`;
    if (this.processedSignals.has(sigKey)) return;

    this.processedSignals.add(sigKey);
    // Cleanup old signal keys
    if (this.processedSignals.size > 200) {
      const first = Array.from(this.processedSignals)[0];
      this.processedSignals.delete(first);
    }

    this.notifyListeners(signal);
  }

  private initLocalTransports() {
    // 1. BroadcastChannel (Same device, local tabs)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.handleIncomingSignal(event.data);
          }
        };
      } catch (e) {
        console.warn('[BuzzerChannel] BroadcastChannel init failed:', e);
      }
    }

    // 2. LocalStorage StorageEvent (Local fallback)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const signal: BuzzerSignal = JSON.parse(event.newValue);
            this.handleIncomingSignal(signal);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private connectRealtimeRelay() {
    if (typeof window === 'undefined') return;

    // 1. Primary Cloud Relay: ntfy.sh SSE (Global cross-network, HTTPS/4G/5G resilient)
    const topic = `gyan_quiz_buzzer_${encodeURIComponent(this.roomId)}`;
    const ntfyUrl = `https://ntfy.sh/${topic}/json`;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }
      this.eventSource = new EventSource(ntfyUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.log('[BuzzerChannel] Connected to global relay for room code:', this.roomId);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.message) {
            const signal: BuzzerSignal = JSON.parse(parsed.message);
            this.handleIncomingSignal(signal);
          }
        } catch {
          // ignore non-json
        }
      };

      this.eventSource.onerror = () => {
        // EventSource automatically retries connections
      };
    } catch (e) {
      console.warn('[BuzzerChannel] ntfy SSE connection error:', e);
    }

    // 2. Secondary Cloud Relay: Backup Public WebSocket Server
    try {
      const wsUrl = `wss://demo.piesocket.com/v3/channel_gyan_${encodeURIComponent(this.roomId)}?api_key=VCXSpR3v2ZTGJy63x0xdjYAkuAYwvdPh45iaSuKG&notify_self=0`;
      if (this.ws) {
        try { this.ws.close(); } catch {}
      }
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => { this.isConnected = true; };
      this.ws.onmessage = (event) => {
        try {
          const signal: BuzzerSignal = JSON.parse(event.data);
          this.handleIncomingSignal(signal);
        } catch {}
      };
    } catch {
      // ignore
    }
  }

  private reconnectRealtimeRelay() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
    this.connectRealtimeRelay();
  }

  public send(signal: BuzzerSignal) {
    const payload: BuzzerSignal = {
      ...signal,
      room: this.roomId,
      senderId: CLIENT_ID,
      timestamp: signal.timestamp || Date.now(),
    };

    // 1. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.error('Failed to post message on BroadcastChannel:', e);
      }
    }

    // 2. LocalStorage Event
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...payload, _time: Date.now() })
        );
      } catch {}
    }

    // 3. Primary Cloud HTTP POST Relay (ntfy.sh)
    if (typeof window !== 'undefined') {
      const topic = `gyan_quiz_buzzer_${encodeURIComponent(this.roomId)}`;
      fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn('[BuzzerChannel] ntfy POST error:', err);
      });
    }

    // 4. Secondary WebSocket Relay
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {}
    }
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
        console.error('Error in buzzer channel listener:', e);
      }
    });
  }
}

export const buzzerChannel = new BuzzerChannelService();
