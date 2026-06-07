import type { Feature, LineString } from './geo.js';

export interface GpsTrackPoint {
  lat: number;
  lng: number;
  ts: string;
}

export type WalkSessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface WalkSession {
  status: WalkSessionStatus;
  startedAt: string | null;
  pausedAt: string | null;
  accumulatedPauseMs: number;
  plannedRoute: Feature<LineString> | null;
  plannedRouteName: string | null;
  savedRouteId: string | null;
  startLat: number;
  startLng: number;
  gpsTrack: GpsTrackPoint[];
  budgetMinutes: number;
  budgetMeters: number;
  walkedMeters: number;
  headHomeRequested: boolean;
}

export const IDLE_WALK_SESSION: WalkSession = {
  status: 'idle',
  startedAt: null,
  pausedAt: null,
  accumulatedPauseMs: 0,
  plannedRoute: null,
  plannedRouteName: null,
  savedRouteId: null,
  startLat: 0,
  startLng: 0,
  gpsTrack: [],
  budgetMinutes: 60,
  budgetMeters: 5000,
  walkedMeters: 0,
  headHomeRequested: false,
};
