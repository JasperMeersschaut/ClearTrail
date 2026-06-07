import type {
  AuthResponse,
  GearRecommendation,
  GenerateRoutesResponse,
  LoginRequest,
  OptimalWeatherWindow,
  RegisterRequest,
  User,
  UserHikeStats,
  UserSettings,
} from '@cleartrail/shared';
import { api } from './client';

export function register(data: RegisterRequest) {
  return api.post<AuthResponse>('/auth/register', data);
}

export function login(data: LoginRequest) {
  return api.post<AuthResponse>('/auth/login', data);
}

export function logout() {
  return api.post<{ ok: boolean }>('/auth/logout', {});
}

export function getMe() {
  return api.get<{ user: User }>('/auth/me');
}

export function getUserSettings() {
  return api.get<UserSettings>('/users/me/settings');
}

export function updateUserSettings(settings: Partial<UserSettings>) {
  return api.put<UserSettings>('/users/me/settings', settings);
}

export function getOptimalWindow(params: {
  lat: number;
  lng: number;
  searchStartTime?: string;
  searchEndTime?: string;
  windowDurationMinutes?: number;
}) {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
  });
  if (params.searchStartTime) {
    qs.set('searchStartTime', params.searchStartTime);
  }
  if (params.searchEndTime) {
    qs.set('searchEndTime', params.searchEndTime);
  }
  if (params.windowDurationMinutes) {
    qs.set('windowDurationMinutes', String(params.windowDurationMinutes));
  }
  return api.get<OptimalWeatherWindow>(`/weather/optimal-window?${qs}`);
}

export function generateRoutes(body: {
  lat: number;
  lng: number;
  durationMinutes: number;
  paceMinPerKm?: number;
  loopRoutesOnly?: boolean;
  dryFeetEnabled?: boolean;
  shadePreferenceEnabled?: boolean;
  count?: number;
}) {
  return api.post<GenerateRoutesResponse>('/routes/generate', body);
}

export function saveWalk(body: {
  name: string;
  lat: number;
  lng: number;
  route: {
    distanceMeters: number;
    estimatedDurationMin: number;
    elevationGainM?: number;
    surfaceBreakdown?: Record<string, number>;
    scoringMetadata?: Record<string, unknown>;
    geojson: {
      type: 'Feature';
      geometry: { type: 'LineString'; coordinates: [number, number][] };
      properties?: Record<string, unknown>;
    };
  };
}) {
  return api.post<{ id: string; createdAt: string }>('/routes/save', body);
}

export function getSavedWalks() {
  return api.get<
    Array<{
      id: string;
      name: string;
      distanceMeters: number;
      estimatedDurationMin: number;
      elevationGainM?: number;
      geojson: {
        type: 'Feature';
        geometry: { type: 'LineString'; coordinates: [number, number][] };
        properties?: Record<string, unknown>;
      };
      createdAt: string;
    }>
  >('/routes/saved/list');
}

export function logHike(body: {
  savedRouteId?: string;
  routeGeojson: {
    type: 'Feature';
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    properties?: Record<string, unknown>;
  };
  distanceMeters: number;
  durationMinutes: number;
  startedAt: string;
  completedAt: string;
  actualTrack?: Array<{ lat: number; lng: number; ts: string }>;
  notes?: string;
}) {
  return api.post<{ id: string; createdAt: string }>('/hikes', body);
}

export function getGearRecommendation(lat: number, lng: number) {
  return api.get<GearRecommendation>(
    `/gear/recommendation?lat=${lat}&lng=${lng}`
  );
}

export function getUserStats() {
  return api.get<UserHikeStats>('/users/me/stats');
}

export function getRecentHikes() {
  return api.get<
    Array<{
      id: string;
      distanceMeters: number;
      durationMinutes: number;
      startedAt: string;
      completedAt: string;
      notes?: string;
      actualTrack?: Array<{ lat: number; lng: number; ts: string }>;
    }>
  >('/hikes');
}
