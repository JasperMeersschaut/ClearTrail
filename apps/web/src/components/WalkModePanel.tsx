import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GeneratedRoute } from '@cleartrail/shared';
import {
  buildRouteDirections,
  formatDistance,
  estimateDurationMinutes,
  metersToDisplayUnit,
  targetDistanceFromDuration,
} from '@cleartrail/shared';
import { generateRoutes, logHike } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useWalkTracker, useWalkTimer } from '../hooks/useWalkTracker';
import { useRouteStore } from '../store/routeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWalkSessionStore } from '../store/walkSessionStore';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface WalkModePanelProps {
  activeRoute: GeneratedRoute | null;
  lat: number;
  lng: number;
  targetDurationMinutes: number;
}

export function WalkModePanel({
  activeRoute,
  lat,
  lng,
  targetDurationMinutes,
}: WalkModePanelProps) {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const loopRoutesOnly = useRouteStore((s) => s.loopRoutesOnly);
  const dryFeetEnabled = useRouteStore((s) => s.dryFeetEnabled);
  const shadePreferenceEnabled = useRouteStore((s) => s.shadePreferenceEnabled);
  const distanceUnit = useSettingsStore((s) => s.distanceUnit);
  const paceMinPerKm = useSettingsStore((s) => s.paceMinPerKm);
  const unitLabel = distanceUnit === 'mi' ? 'mi' : 'km';

  const status = useWalkSessionStore((s) => s.status);
  const walkedMeters = useWalkSessionStore((s) => s.walkedMeters);
  const budgetMinutes = useWalkSessionStore((s) => s.budgetMinutes);
  const budgetMeters = useWalkSessionStore((s) => s.budgetMeters);
  const headHomeRequested = useWalkSessionStore((s) => s.headHomeRequested);
  const plannedRouteName = useWalkSessionStore((s) => s.plannedRouteName);
  const plannedRoute = useWalkSessionStore((s) => s.plannedRoute);
  const startWalk = useWalkSessionStore((s) => s.startWalk);
  const pauseWalk = useWalkSessionStore((s) => s.pauseWalk);
  const resumeWalk = useWalkSessionStore((s) => s.resumeWalk);
  const adjustBudgetMinutes = useWalkSessionStore((s) => s.adjustBudgetMinutes);
  const updateWalkPlan = useWalkSessionStore((s) => s.updateWalkPlan);
  const requestHeadHome = useWalkSessionStore((s) => s.requestHeadHome);
  const finishWalk = useWalkSessionStore((s) => s.finishWalk);
  const getElapsedSeconds = useWalkSessionStore((s) => s.getElapsedSeconds);
  const gpsTrack = useWalkSessionStore((s) => s.gpsTrack);

  const elapsedSeconds = useWalkTimer();
  const currentPosition = gpsTrack[gpsTrack.length - 1] ?? { lat, lng };
  const [, tick] = useState(0);
  useEffect(() => {
    if (status !== 'active' && status !== 'paused') return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  useWalkTracker(status === 'active');

  useEffect(() => {
    if (status !== 'active' && status !== 'paused') return;
    const wakeLockSupported = 'wakeLock' in navigator;
    let wakeLock: WakeLockSentinel | null = null;

    async function acquireLock() {
      if (!wakeLockSupported) return;
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch {
        /* unsupported */
      }
    }
    acquireLock();

    return () => {
      wakeLock?.release().catch(() => {});
    };
  }, [status]);

  const logMutation = useMutation({
    mutationFn: logHike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['hikes'] });
    },
  });

  const replanMutation = useMutation({
    mutationFn: async (nextRemainingMinutes: number) => {
      if (!plannedRoute || nextRemainingMinutes <= 0) return null;

      const response = await generateRoutes({
        lat: currentPosition.lat,
        lng: currentPosition.lng,
        durationMinutes: nextRemainingMinutes,
        paceMinPerKm,
        loopRoutesOnly: plannedRoute.properties?.isLoop !== false ? loopRoutesOnly : false,
        dryFeetEnabled,
        shadePreferenceEnabled,
        count: 1,
      });

      return response.routes[response.selectedIndex] ?? response.routes[0] ?? null;
    },
  });

  const remainingMinutes = Math.max(0, budgetMinutes - Math.floor(elapsedSeconds / 60));
  const remainingMeters = Math.max(0, budgetMeters - walkedMeters);
  const routeDirections = useMemo(() => {
    if (!plannedRoute) return [];
    return buildRouteDirections(plannedRoute.geometry.coordinates, currentPosition);
  }, [plannedRoute, currentPosition.lat, currentPosition.lng]);

  function handleStart(planned: boolean) {
    const budgetMin = planned
      ? estimateDurationMinutes(
          activeRoute?.distanceMeters ??
            targetDistanceFromDuration(targetDurationMinutes, paceMinPerKm),
          paceMinPerKm
        )
      : targetDurationMinutes;

    startWalk({
      startLat: lat,
      startLng: lng,
      budgetMinutes: budgetMin,
      paceMinPerKm,
      plannedRoute: planned ? (activeRoute?.geojson ?? null) : null,
      plannedRouteName: planned ? (activeRoute?.name ?? 'Planned walk') : 'Free walk',
      savedRouteId: null,
    });
  }

  async function handleFinish() {
    const elapsed = getElapsedSeconds();
    const session = finishWalk();
    const completedAt = new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));
    const distanceMeters = Math.max(session.walkedMeters, 1);

    const coordinates =
      session.gpsTrack.length >= 2
        ? session.gpsTrack.map((p) => [p.lng, p.lat] as [number, number])
        : session.plannedRoute?.geometry.coordinates ?? [
            [session.startLng, session.startLat],
          ];

    const routeGeojson = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
      properties: {
        plannedRouteName: session.plannedRouteName,
        headHomeRequested: session.headHomeRequested,
      },
    };

    if (isLoggedIn) {
      await logMutation.mutateAsync({
        savedRouteId: session.savedRouteId ?? undefined,
        routeGeojson,
        distanceMeters,
        durationMinutes,
        startedAt: session.startedAt ?? completedAt,
        completedAt,
        actualTrack: session.gpsTrack,
        notes: session.plannedRouteName ?? undefined,
      });
    }
  }

  async function handleAdjustMinutes(deltaMinutes: number) {
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const nextRemainingMinutes = Math.max(0, remainingMinutes + deltaMinutes);

    adjustBudgetMinutes(deltaMinutes);

    if (!plannedRoute) return;

    if (nextRemainingMinutes <= 0) {
      updateWalkPlan({
        budgetMinutes: elapsedMinutes,
        budgetMeters: walkedMeters,
        plannedRoute: null,
        plannedRouteName,
      });
      return;
    }

    if (nextRemainingMinutes < 15) {
      updateWalkPlan({
        budgetMinutes: elapsedMinutes + nextRemainingMinutes,
        budgetMeters,
        plannedRoute,
        plannedRouteName,
      });
      return;
    }

    try {
      const nextRoute = await replanMutation.mutateAsync(nextRemainingMinutes);
      if (!nextRoute) return;

      updateWalkPlan({
        budgetMinutes: elapsedMinutes + nextRemainingMinutes,
        budgetMeters: walkedMeters + nextRoute.distanceMeters,
        plannedRoute: nextRoute.geojson,
        plannedRouteName: nextRoute.name,
      });
    } catch {
      updateWalkPlan({
        budgetMinutes: elapsedMinutes + nextRemainingMinutes,
        budgetMeters: walkedMeters + targetDistanceFromDuration(nextRemainingMinutes, paceMinPerKm),
        plannedRoute,
        plannedRouteName,
      });
    }
  }

  if (status === 'idle') {
    return (
      <div className="card walk-panel">
        <h2>Start Walking</h2>
        <p className="muted">
          Pick a route or just head out — your path is tracked live on the map.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!activeRoute}
          onClick={() => handleStart(true)}
        >
          Start planned route
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleStart(false)}
        >
          Just walk
        </button>
        {!isLoggedIn && (
          <p className="muted walk-hint">
            Sign in to save completed walks to your dashboard.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card walk-panel walk-panel-active">
      <h2>{status === 'paused' ? 'Walk paused' : 'Walk in progress'}</h2>
      {plannedRouteName && (
        <p className="muted">{plannedRouteName}</p>
      )}
      {headHomeRequested && (
        <p className="walk-alert">Heading home — finish when you arrive.</p>
      )}

      <div className="walk-stats-grid">
        <div className="walk-stat">
          <span className="walk-stat-value">{formatElapsed(elapsedSeconds)}</span>
          <span className="walk-stat-label">Elapsed</span>
        </div>
        <div className="walk-stat">
          <span className="walk-stat-value">
            {metersToDisplayUnit(walkedMeters, distanceUnit).toFixed(2)} {unitLabel}
          </span>
          <span className="walk-stat-label">Walked</span>
        </div>
        <div className="walk-stat">
          <span className="walk-stat-value">{remainingMinutes} min</span>
          <span className="walk-stat-label">Remaining</span>
        </div>
        <div className="walk-stat">
          <span className="walk-stat-value">
            {metersToDisplayUnit(remainingMeters, distanceUnit).toFixed(1)} {unitLabel}
          </span>
          <span className="walk-stat-label">Left</span>
        </div>
      </div>

      <div className="walk-adjust-row">
        <span className="walk-adjust-label">Time</span>
        <button type="button" className="btn-adjust" onClick={() => handleAdjustMinutes(-15)}>
          −15m
        </button>
        <button type="button" className="btn-adjust" onClick={() => handleAdjustMinutes(15)}>
          +15m
        </button>
      </div>

      {routeDirections.length > 0 && (
        <div className="walk-directions card-inset">
          <h3>Directions</h3>
          <p className="muted walk-hint">
            Rebased from your latest GPS point so the remaining route grows from where you are now.
          </p>
          <ol className="direction-list">
            {routeDirections.map((step, index) => (
              <li key={`${step.instruction}-${index}`} className="direction-step">
                <span className="direction-step-title">{step.instruction}</span>
                <span className="direction-step-meta">
                  {formatDistance(step.distanceMeters, distanceUnit)} · {step.direction}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="walk-actions">
        {status === 'paused' ? (
          <button type="button" className="btn btn-secondary" onClick={resumeWalk}>
            Resume
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={pauseWalk}>
            Pause
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={requestHeadHome}>
          Head home
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleFinish}
          disabled={logMutation.isPending}
        >
          {logMutation.isPending ? 'Saving...' : 'Finish walk'}
        </button>
      </div>

      <p className="muted walk-hint">
        {gpsTrack.length} GPS points · keep app open for best tracking
      </p>
    </div>
  );
}
