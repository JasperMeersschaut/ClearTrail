import type {
  AuthResponse,
  GearRecommendation,
  GeneratedRoute,
  LoginRequest,
  OptimalWeatherWindow,
  RegisterRequest,
  User,
  UserHikeStats,
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

export function getOptimalWindow(lat: number, lng: number) {
  return api.get<OptimalWeatherWindow>(
    `/weather/optimal-window?lat=${lat}&lng=${lng}`
  );
}

export function generateRoute(body: {
  lat: number;
  lng: number;
  durationMinutes: number;
  walkingSpeedKmh?: number;
  dryFeetEnabled?: boolean;
  shadePreferenceEnabled?: boolean;
}) {
  return api.post<GeneratedRoute>('/routes/generate', body);
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
    }>
  >('/hikes');
}
