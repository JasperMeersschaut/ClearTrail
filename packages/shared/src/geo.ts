import { haversineMeters } from './settings.js';

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

export interface RouteDirectionStep {
  instruction: string;
  distanceMeters: number;
  bearing: number;
  direction: CardinalDirection;
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

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeBearing(bearing: number): number {
  return ((bearing % 360) + 360) % 360;
}

function bearingDifference(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function bearingBetweenCoordinates(
  from: Coordinate,
  to: Coordinate
): number {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const deltaLng = toRadians(toLng - fromLng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return normalizeBearing((Math.atan2(y, x) * 180) / Math.PI);
}

function projectPointOnSegment(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate
): { point: Coordinate; distanceMeters: number } {
  const latMid = (start[1] + end[1]) / 2;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos(toRadians(latMid));

  const startX = start[0] * metersPerDegreeLng;
  const startY = start[1] * metersPerDegreeLat;
  const endX = end[0] * metersPerDegreeLng;
  const endY = end[1] * metersPerDegreeLat;
  const pointX = point[0] * metersPerDegreeLng;
  const pointY = point[1] * metersPerDegreeLat;

  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const rawT = segmentLengthSquared === 0
    ? 0
    : ((pointX - startX) * segmentX + (pointY - startY) * segmentY) /
      segmentLengthSquared;
  const t = Math.max(0, Math.min(1, rawT));

  const projectedX = startX + segmentX * t;
  const projectedY = startY + segmentY * t;

  return {
    point: [projectedX / metersPerDegreeLng, projectedY / metersPerDegreeLat],
    distanceMeters: Math.hypot(pointX - projectedX, pointY - projectedY),
  };
}

function trimCoordinatesToCurrentPosition(
  coordinates: Coordinate[],
  currentPosition?: LatLng | null
): Coordinate[] {
  if (!currentPosition || coordinates.length < 2) {
    return coordinates;
  }

  const current: Coordinate = [currentPosition.lng, currentPosition.lat];
  let bestIndex = 0;
  let bestPoint = coordinates[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const projection = projectPointOnSegment(
      current,
      coordinates[index],
      coordinates[index + 1]
    );

    if (projection.distanceMeters < bestDistance) {
      bestDistance = projection.distanceMeters;
      bestIndex = index;
      bestPoint = projection.point;
    }
  }

  return [bestPoint, ...coordinates.slice(bestIndex + 1)];
}

function mergeDirectionSegments(
  segments: Array<{ bearing: number; distanceMeters: number }>
): Array<{ bearing: number; distanceMeters: number }> {
  const merged: Array<{ bearing: number; distanceMeters: number }> = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous && Math.abs(bearingDifference(previous.bearing, segment.bearing)) <= 20) {
      previous.distanceMeters += segment.distanceMeters;
      previous.bearing = normalizeBearing((previous.bearing + segment.bearing) / 2);
      continue;
    }

    merged.push({ ...segment });
  }

  return merged;
}

export function buildRouteDirections(
  coordinates: Coordinate[],
  currentPosition?: LatLng | null,
  maxSteps = 4
): RouteDirectionStep[] {
  const remainingCoordinates = trimCoordinatesToCurrentPosition(
    coordinates,
    currentPosition
  );

  if (remainingCoordinates.length < 2) {
    return [];
  }

  const segments = remainingCoordinates
    .map((point, index) => {
      if (index === remainingCoordinates.length - 1) return null;
      const nextPoint = remainingCoordinates[index + 1];
      const distanceMeters = haversineMeters(
        point[1],
        point[0],
        nextPoint[1],
        nextPoint[0]
      );

      if (distanceMeters < 6) return null;

      return {
        bearing: bearingBetweenCoordinates(point, nextPoint),
        distanceMeters,
      };
    })
    .filter((segment): segment is { bearing: number; distanceMeters: number } =>
      segment !== null
    );

  const mergedSegments = mergeDirectionSegments(segments).slice(0, maxSteps);

  return mergedSegments.map((segment, index) => {
    const direction = bearingToCardinal(segment.bearing);
    const previous = mergedSegments[index - 1];
    const delta = previous
      ? bearingDifference(previous.bearing, segment.bearing)
      : 0;
    const turn = Math.abs(delta) <= 35
      ? 'Continue'
      : delta > 0
        ? 'Turn right'
        : 'Turn left';

    return {
      instruction:
        index === 0
          ? `Head ${direction}`
          : `${turn}, then go ${direction.toLowerCase()}`,
      distanceMeters: segment.distanceMeters,
      bearing: segment.bearing,
      direction,
    };
  });
}

export const ROUTE_COLORS = [
  '#40916c',
  '#4361ee',
  '#f77f00',
  '#9d4edd',
  '#e63946',
] as const;
