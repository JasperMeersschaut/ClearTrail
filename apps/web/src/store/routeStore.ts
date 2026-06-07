import { create } from 'zustand';
import type { GeneratedRoute, LatLng } from '@cleartrail/shared';

interface RouteState {
  userLocation: LatLng | null;
  durationMinutes: number;
  walkingSpeedKmh: number;
  dryFeetEnabled: boolean;
  shadePreferenceEnabled: boolean;
  activeRoute: GeneratedRoute | null;
  setUserLocation: (location: LatLng | null) => void;
  setDurationMinutes: (minutes: number) => void;
  setWalkingSpeedKmh: (speed: number) => void;
  setDryFeetEnabled: (enabled: boolean) => void;
  setShadePreferenceEnabled: (enabled: boolean) => void;
  setActiveRoute: (route: GeneratedRoute | null) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  userLocation: null,
  durationMinutes: 60,
  walkingSpeedKmh: 4.5,
  dryFeetEnabled: true,
  shadePreferenceEnabled: true,
  activeRoute: null,
  setUserLocation: (userLocation) => set({ userLocation }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
  setWalkingSpeedKmh: (walkingSpeedKmh) => set({ walkingSpeedKmh }),
  setDryFeetEnabled: (dryFeetEnabled) => set({ dryFeetEnabled }),
  setShadePreferenceEnabled: (shadePreferenceEnabled) =>
    set({ shadePreferenceEnabled }),
  setActiveRoute: (activeRoute) => set({ activeRoute }),
}));
