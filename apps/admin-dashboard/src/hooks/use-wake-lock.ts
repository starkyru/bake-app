import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const [isSupported] = useState(() => 'wakeLock' in navigator);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
      setIsActive(true);
    } catch {
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isActive) {
      release();
    } else {
      request();
    }
  }, [isActive, request, release]);

  useEffect(() => {
    if (!isActive) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isActive) {
        request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, request]);

  useEffect(() => {
    return () => { wakeLockRef.current?.release(); };
  }, []);

  return { isActive, isSupported, toggle };
}
