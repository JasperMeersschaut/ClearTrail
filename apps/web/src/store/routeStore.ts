import { create } from 'zustand';
import type { GeneratedRoute, LatLng } from '@cleartrail/shared';

function defaultSearchEnd(): string {
  return new Date(Date.now() + 48 * 3600_000).toISOString();
}

interface RouteState {
  userLocation: LatLng | null;
  durationMinutes: number;
  walkingSpeedKmh: number;
  loopRoutesOnly: boolean;
  dryFeetEnabled: boolean;
  shadePreferenceEnabled: boolean;
  searchStartTime: string;
  searchEndTime: string;
  routes: GeneratedRoute[];
  selectedRouteIndex: number;
  setUserLocation: (location: LatLng | null) => void;
  setDurationMinutes: (minutes: number) => void;
  setWalkingSpeedKmh: (speed: number) => void;
  setLoopRoutesOnly: (enabled: boolean) => void;
  setDryFeetEnabled: (enabled: boolean) => void;
  setShadePreferenceEnabled: (enabled: boolean) => void;
  setSearchStartTime: (iso: string) => void;
  setSearchEndTime: (iso: string) => void;
  setRoutes: (routes: GeneratedRoute[], selectedIndex?: number) => void;
  setSelectedRouteIndex: (index: number) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  userLocation: null,
  durationMinutes: 60,
  walkingSpeedKmh: 4.5,
  loopRoutesOnly: true,
  dryFeetEnabled: true,
  shadePreferenceEnabled: true,
  searchStartTime: new Date().toISOString(),
  searchEndTime: defaultSearchEnd(),
  routes: [],
  selectedRouteIndex: 0,
  setUserLocation: (userLocation) => set({ userLocation }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
  setWalkingSpeedKmh: (walkingSpeedKmh) => set({ walkingSpeedKmh }),
  setLoopRoutesOnly: (loopRoutesOnly) => set({ loopRoutesOnly }),
  setDryFeetEnabled: (dryFeetEnabled) => set({ dryFeetEnabled }),
  setShadePreferenceEnabled: (shadePreferenceEnabled) =>
    set({ shadePreferenceEnabled }),
  setSearchStartTime: (searchStartTime) => set({ searchStartTime }),
  setSearchEndTime: (searchEndTime) => set({ searchEndTime }),
  setRoutes: (routes, selectedIndex = 0) =>
    set({ routes, selectedRouteIndex: selectedIndex }),
  setSelectedRouteIndex: (selectedRouteIndex) => set({ selectedRouteIndex }),
}));
