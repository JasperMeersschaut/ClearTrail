import { useEffect, useRef } from 'react';
import { haversineMeters } from '@cleartrail/shared';
import { useWalkSessionStore } from '../store/walkSessionStore';

export function useWalkTracker(enabled: boolean) {
  const status = useWalkSessionStore((s) => s.status);
  const addGpsPoint = useWalkSessionStore((s) => s.addGpsPoint);
  const addWalkedMeters = useWalkSessionStore((s) => s.addWalkedMeters);
  const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || status !== 'active') {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const ts = new Date().toISOString();

        if (lastPointRef.current) {
          const dist = haversineMeters(
            lastPointRef.current.lat,
            lastPointRef.current.lng,
            lat,
            lng
          );
          if (dist > 2) {
            addWalkedMeters(dist);
          }
        }

        lastPointRef.current = { lat, lng };
        addGpsPoint({ lat, lng, ts });
      },
      (err) => console.warn('GPS tracking error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, status, addGpsPoint, addWalkedMeters]);

  useEffect(() => {
    if (status === 'idle') {
      lastPointRef.current = null;
    }
  }, [status]);
}

export function useWalkTimer() {
  const status = useWalkSessionStore((s) => s.status);
  const getElapsedSeconds = useWalkSessionStore((s) => s.getElapsedSeconds);
  const elapsedRef = useRef(getElapsedSeconds());

  useEffect(() => {
    if (status !== 'active' && status !== 'paused') return;

    const interval = setInterval(() => {
      elapsedRef.current = getElapsedSeconds();
    }, 1000);

    return () => clearInterval(interval);
  }, [status, getElapsedSeconds]);

  return getElapsedSeconds();
}
