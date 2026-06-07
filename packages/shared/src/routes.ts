import type { Feature, LineString } from './geo.js';

export interface GenerateRouteRequest {
  lat: number;
  lng: number;
  durationMinutes: number;
  walkingSpeedKmh?: number;
  dryFeetEnabled?: boolean;
  shadePreferenceEnabled?: boolean;
}

export interface SurfaceBreakdown {
  paved?: number;
  gravel?: number;
  unpaved?: number;
  unknown?: number;
}

export interface ScoringMetadata {
  dryFeetApplied?: boolean;
  shadePreferenceApplied?: boolean;
  season?: 'summer' | 'winter' | 'spring' | 'autumn';
  weights?: Record<string, number>;
}

export interface GeneratedRoute {
  id?: string;
  name: string;
  distanceMeters: number;
  estimatedDurationMin: number;
  elevationGainM?: number;
  surfaceBreakdown: SurfaceBreakdown;
  scoringMetadata: ScoringMetadata;
  geojson: Feature<LineString>;
}

export interface SavedRoute extends GeneratedRoute {
  id: string;
  userId: string;
  createdAt: string;
}

export interface HikeLogInput {
  savedRouteId?: string;
  routeGeojson: Feature<LineString>;
  distanceMeters: number;
  durationMinutes: number;
  startedAt: string;
  completedAt: string;
  weatherConditions?: Record<string, unknown>;
  notes?: string;
}

export interface UserHikeStats {
  completedRoutes: number;
  totalKmWalked: number;
  totalHikingHours: number;
}

export interface GearRecommendation {
  layers: string[];
  bring: string[];
  notes: string[];
}
