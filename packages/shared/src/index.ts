export * from './geo.js';
export * from './weather.js';
export * from './routes.js';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface UserPreferences {
  walkingSpeedKmh: number;
  defaultDurationMinutes: number;
  temperatureUnit: 'C' | 'F';
  dryFeetEnabled: boolean;
  shadePreferenceEnabled: boolean;
  maxPrecipitationPct: number;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
