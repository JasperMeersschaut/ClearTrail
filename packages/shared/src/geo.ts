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

export type CardinalDirection =
  | 'N'
  | 'NE'
  | 'E'
  | 'SE'
  | 'S'
  | 'SW'
  | 'W'
  | 'NW';

const CARDINAL_BEARINGS: Record<CardinalDirection, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

export function bearingToCardinal(bearing: number): CardinalDirection {
  const normalized = ((bearing % 360) + 360) % 360;
  let closest: CardinalDirection = 'N';
  let minDiff = 360;

  for (const [dir, deg] of Object.entries(CARDINAL_BEARINGS) as [
    CardinalDirection,
    number,
  ][]) {
    const diff = Math.abs(normalized - deg);
    const wrapDiff = Math.min(diff, 360 - diff);
    if (wrapDiff < minDiff) {
      minDiff = wrapDiff;
      closest = dir;
    }
  }

  return closest;
}

export function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number
): LatLng {
  const R = 6371000;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const d = distanceM / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}

export const ROUTE_COLORS = [
  '#40916c',
  '#4361ee',
  '#f77f00',
  '#9d4edd',
  '#e63946',
] as const;
