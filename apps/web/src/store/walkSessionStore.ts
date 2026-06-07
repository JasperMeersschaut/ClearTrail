import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Feature, GpsTrackPoint, LineString, WalkSession } from '@cleartrail/shared';
import { IDLE_WALK_SESSION, targetDistanceFromDuration } from '@cleartrail/shared';

export interface PendingSavedWalkStart {
  savedRouteId: string;
  plannedRoute: Feature<LineString>;
  plannedRouteName: string;
  budgetMinutes: number;
  paceMinPerKm: number;
}

interface WalkSessionState extends WalkSession {
  pendingSavedWalkStart: PendingSavedWalkStart | null;
  replayTrack: GpsTrackPoint[] | null;
  queueSavedWalkStart: (pending: PendingSavedWalkStart) => void;
  clearPendingSavedWalkStart: () => void;
  setReplayTrack: (track: GpsTrackPoint[] | null) => void;
  updateWalkPlan: (plan: {
    budgetMinutes: number;
    budgetMeters: number;
    plannedRoute: Feature<LineString> | null;
    plannedRouteName?: string | null;
  }) => void;
  startWalk: (opts: {
    startLat: number;
    startLng: number;
    budgetMinutes: number;
    paceMinPerKm: number;
    plannedRoute?: Feature<LineString> | null;
    plannedRouteName?: string | null;
    savedRouteId?: string | null;
  }) => void;
  pauseWalk: () => void;
  resumeWalk: () => void;
  addGpsPoint: (point: GpsTrackPoint) => void;
  addWalkedMeters: (meters: number) => void;
  adjustBudgetMinutes: (delta: number) => void;
  adjustBudgetMeters: (deltaMeters: number) => void;
  requestHeadHome: () => void;
  finishWalk: () => WalkSession;
  resetSession: () => void;
  getElapsedSeconds: () => number;
}

export const useWalkSessionStore = create<WalkSessionState>()(
  persist(
    (set, get) => ({
      ...IDLE_WALK_SESSION,
      pendingSavedWalkStart: null,
      replayTrack: null,

      queueSavedWalkStart: (pending) => set({ pendingSavedWalkStart: pending }),
      clearPendingSavedWalkStart: () => set({ pendingSavedWalkStart: null }),
      setReplayTrack: (track) => set({ replayTrack: track }),

      updateWalkPlan: (plan) =>
        set((state) => ({
          ...state,
          budgetMinutes: plan.budgetMinutes,
          budgetMeters: plan.budgetMeters,
          plannedRoute: plan.plannedRoute,
          plannedRouteName: plan.plannedRouteName ?? state.plannedRouteName,
        })),

      startWalk: ({
        startLat,
        startLng,
        budgetMinutes,
        paceMinPerKm,
        plannedRoute = null,
        plannedRouteName = null,
        savedRouteId = null,
      }) => {
        set({
          status: 'active',
          startedAt: new Date().toISOString(),
          pausedAt: null,
          accumulatedPauseMs: 0,
          plannedRoute,
          plannedRouteName,
          savedRouteId: savedRouteId ?? null,
          startLat,
          startLng,
          gpsTrack: [{ lat: startLat, lng: startLng, ts: new Date().toISOString() }],
          budgetMinutes,
          budgetMeters: targetDistanceFromDuration(budgetMinutes, paceMinPerKm),
          walkedMeters: 0,
          headHomeRequested: false,
        });
      },

      pauseWalk: () => {
        const { status } = get();
        if (status !== 'active') return;
        set({ status: 'paused', pausedAt: new Date().toISOString() });
      },

      resumeWalk: () => {
        const { status, pausedAt, accumulatedPauseMs } = get();
        if (status !== 'paused' || !pausedAt) return;
        const pauseDuration = Date.now() - new Date(pausedAt).getTime();
        set({
          status: 'active',
          pausedAt: null,
          accumulatedPauseMs: accumulatedPauseMs + pauseDuration,
        });
      },

      addGpsPoint: (point) => {
        set((state) => ({
          gpsTrack: [...state.gpsTrack, point],
        }));
      },

      addWalkedMeters: (meters) => {
        set((state) => ({ walkedMeters: state.walkedMeters + meters }));
      },

      adjustBudgetMinutes: (delta) => {
        set((state) => ({
          budgetMinutes: Math.max(0, state.budgetMinutes + delta),
        }));
      },

      adjustBudgetMeters: (deltaMeters) => {
        set((state) => ({
          budgetMeters: Math.max(0, state.budgetMeters + deltaMeters),
        }));
      },

      requestHeadHome: () => {
        set({ headHomeRequested: true, budgetMinutes: 0, budgetMeters: 0 });
      },

      finishWalk: () => {
        const snapshot = { ...get(), status: 'completed' as const };
        set({ ...IDLE_WALK_SESSION });
        return snapshot;
      },

      resetSession: () => set({ ...IDLE_WALK_SESSION }),

      getElapsedSeconds: () => {
        const { startedAt, accumulatedPauseMs, status, pausedAt } = get();
        if (!startedAt) return 0;
        const end = status === 'paused' && pausedAt ? pausedAt : new Date().toISOString();
        const elapsedMs =
          new Date(end).getTime() - new Date(startedAt).getTime() - accumulatedPauseMs;
        return Math.max(0, Math.floor(elapsedMs / 1000));
      },
    }),
    { name: 'cleartrail-walk-session', partialize: (state) => ({
      status: state.status,
      startedAt: state.startedAt,
      pausedAt: state.pausedAt,
      accumulatedPauseMs: state.accumulatedPauseMs,
      plannedRoute: state.plannedRoute,
      plannedRouteName: state.plannedRouteName,
      savedRouteId: state.savedRouteId,
      startLat: state.startLat,
      startLng: state.startLng,
      gpsTrack: state.gpsTrack,
      budgetMinutes: state.budgetMinutes,
      budgetMeters: state.budgetMeters,
      walkedMeters: state.walkedMeters,
      headHomeRequested: state.headHomeRequested,
    }) },
  )
);
