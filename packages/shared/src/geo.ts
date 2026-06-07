export type Coordinate = [number, number]; // [lng, lat]

export interface Point {
  type: 'Point';
  coordinates: Coordinate;
}

export interface LineString {
  type: 'LineString';
  coordinates: Coordinate[];
}

export interface Feature<G = LineString> {
  type: 'Feature';
  geometry: G;
  properties?: Record<string, unknown>;
}

export interface FeatureCollection<G = LineString> {
  type: 'FeatureCollection';
  features: Feature<G>[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

export function latLngToCoordinate({ lat, lng }: LatLng): Coordinate {
  return [lng, lat];
}

export function coordinateToLatLng([lng, lat]: Coordinate): LatLng {
  return { lat, lng };
}

export function durationToDistanceMeters(
  durationMinutes: number,
  walkingSpeedKmh: number
): number {
  return (durationMinutes / 60) * walkingSpeedKmh * 1000;
}
