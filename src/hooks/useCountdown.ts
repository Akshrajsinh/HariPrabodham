import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../utils/sound';

export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          sfx.timeUp();
          onExpireRef.current?.();
          return 0;
        }
        if (s <= 6) sfx.tick();
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = useCallback(() => {
    setSecondsLeft((s) => (s <= 0 ? initialSeconds : s));
    setRunning(true);
  }, [initialSeconds]);

  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(
    (seconds?: number) => {
      setRunning(false);
      setSecondsLeft(seconds ?? initialSeconds);
    },
    [initialSeconds]
  );

  return { secondsLeft, running, start, pause, toggle, reset, setSecondsLeft };
}
