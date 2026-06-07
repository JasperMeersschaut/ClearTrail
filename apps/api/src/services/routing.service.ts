import axios from 'axios';
import type {
  Feature,
  GenerateRouteRequest,
  GeneratedRoute,
  GenerateRoutesResponse,
  LineString,
} from '@cleartrail/shared';
import {
  ROUTE_COLORS,
  destinationPoint,
  durationToDistanceMeters,
} from '@cleartrail/shared';
import { env } from '../config/env.js';
import { getRecentPrecipitation } from './weather.service.js';
import { scoreRoute } from './scoring.service.js';

const ORS_BASE = 'https://api.openrouteservice.org/v2';
const DEFAULT_ROUTE_COUNT = 5;

/** Spread bearings/seeds so alternatives differ without fixed cardinals. */
function variantSeed(index: number): number {
  return index * 7919 + 42;
}

function variantBearing(index: number): number {
  return (index * 137.508 + 23) % 360;
}

function coordinatesClose(
  a: [number, number],
  b: [number, number],
  toleranceM = 30
): boolean {
  const latMid = (a[1] + b[1]) / 2;
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((latMid * Math.PI) / 180);
  const dLat = (a[1] - b[1]) * mPerDegLat;
  const dLng = (a[0] - b[0]) * mPerDegLng;
  return Math.hypot(dLat, dLng) <= toleranceM;
}

function closeLoopCoordinates(
  coordinates: [number, number][]
): [number, number][] {
  if (coordinates.length < 2) return coordinates;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (coordinatesClose(first, last)) {
    return coordinates;
  }

  return [...coordinates, first];
}

function routeName(index: number, isLoop: boolean): string {
  return isLoop ? `Loop ${index + 1}` : `Route ${index + 1}`;
}

function buildRoute(
  feature: Feature<LineString>,
  opts: {
    index: number;
    isLoop: boolean;
    targetDistanceM: number;
    durationMinutes: number;
  }
): GeneratedRoute {
  const coords = opts.isLoop
    ? closeLoopCoordinates(feature.geometry.coordinates as [number, number][])
    : (feature.geometry.coordinates as [number, number][]);

  const distanceMeters =
    (feature.properties as { summary?: { distance?: number } } | undefined)
      ?.summary?.distance ?? opts.targetDistanceM;

  return {
    name: routeName(opts.index, opts.isLoop),
    distanceMeters,
    estimatedDurationMin: opts.durationMinutes,
    surfaceBreakdown: {},
    scoringMetadata: {},
    geojson: {
      ...feature,
      geometry: { type: 'LineString', coordinates: coords },
      properties: { ...feature.properties, isLoop: opts.isLoop },
    },
    routeIndex: opts.index,
    color: ROUTE_COLORS[opts.index % ROUTE_COLORS.length],
  };
}

function mockLoopRoute(
  lat: number,
  lng: number,
  targetDistanceM: number,
  durationMinutes: number,
  index: number
): GeneratedRoute {
  const radiusDeg = targetDistanceM / 4 / 111_320;
  const rotation = (variantBearing(index) * Math.PI) / 180;
  const points: [number, number][] = [];

  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * 2 * Math.PI + rotation;
    points.push([
      lng + Math.cos(angle) * radiusDeg,
      lat + Math.sin(angle) * radiusDeg * 0.72,
    ]);
  }

  return buildRoute(
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: closeLoopCoordinates(points) },
      properties: { mock: true },
    },
    { index, isLoop: true, targetDistanceM, durationMinutes }
  );
}

function mockOneWayRoute(
  lat: number,
  lng: number,
  targetDistanceM: number,
  durationMinutes: number,
  index: number
): GeneratedRoute {
  const bearing = variantBearing(index);
  const halfDist = targetDistanceM / 2;
  const end = destinationPoint(lat, lng, bearing, halfDist);
  const mid = destinationPoint(lat, lng, bearing, halfDist * 0.55);

  const points: [number, number][] = [
    [lng, lat],
    [mid.lng, mid.lat],
    [end.lng, end.lat],
  ];

  return buildRoute(
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: points },
      properties: { mock: true },
    },
    { index, isLoop: false, targetDistanceM, durationMinutes }
  );
}

async function fetchOrsRoundTrip(
  lat: number,
  lng: number,
  targetDistanceM: number,
  durationMinutes: number,
  index: number
): Promise<GeneratedRoute | null> {
  const seed = variantSeed(index);

  try {
    const response = await axios.post(
      `${ORS_BASE}/directions/foot-hiking/geojson`,
      {
        coordinates: [[lng, lat]],
        options: {
          round_trip: {
            length: Math.round(targetDistanceM),
            points: 3 + (index % 2),
            seed,
          },
        },
      },
      {
        headers: {
          Authorization: env.OPENROUTESERVICE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const feature = response.data.features?.[0] as Feature<LineString> | undefined;
    if (!feature?.geometry?.coordinates?.length) return null;

    return buildRoute(feature, {
      index,
      isLoop: true,
      targetDistanceM,
      durationMinutes,
    });
  } catch {
    return null;
  }
}

async function fetchOrsOneWay(
  lat: number,
  lng: number,
  targetDistanceM: number,
  durationMinutes: number,
  index: number
): Promise<GeneratedRoute | null> {
  const bearing = variantBearing(index);
  const endpoint = destinationPoint(lat, lng, bearing, targetDistanceM / 2);

  try {
    const response = await axios.post(
      `${ORS_BASE}/directions/foot-hiking/geojson`,
      {
        coordinates: [
          [lng, lat],
          [endpoint.lng, endpoint.lat],
        ],
        elevation: false,
      },
      {
        headers: {
          Authorization: env.OPENROUTESERVICE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const feature = response.data.features?.[0] as Feature<LineString> | undefined;
    if (!feature?.geometry?.coordinates?.length) return null;

    return buildRoute(feature, {
      index,
      isLoop: false,
      targetDistanceM,
      durationMinutes,
    });
  } catch {
    return null;
  }
}

async function generateSingleRoute(
  request: GenerateRouteRequest,
  index: number,
  targetDistanceM: number,
  recentRainMm: number,
  loopRoutesOnly: boolean
): Promise<GeneratedRoute> {
  let route: GeneratedRoute;

  if (!env.OPENROUTESERVICE_API_KEY) {
    route = loopRoutesOnly
      ? mockLoopRoute(
          request.lat,
          request.lng,
          targetDistanceM,
          request.durationMinutes,
          index
        )
      : mockOneWayRoute(
          request.lat,
          request.lng,
          targetDistanceM,
          request.durationMinutes,
          index
        );
  } else if (loopRoutesOnly) {
    route =
      (await fetchOrsRoundTrip(
        request.lat,
        request.lng,
        targetDistanceM,
        request.durationMinutes,
        index
      )) ??
      mockLoopRoute(
        request.lat,
        request.lng,
        targetDistanceM,
        request.durationMinutes,
        index
      );
  } else {
    route =
      (await fetchOrsOneWay(
        request.lat,
        request.lng,
        targetDistanceM,
        request.durationMinutes,
        index
      )) ??
      mockOneWayRoute(
        request.lat,
        request.lng,
        targetDistanceM,
        request.durationMinutes,
        index
      );
  }

  return scoreRoute(route, {
    recentRainMm,
    shadePreferenceEnabled: request.shadePreferenceEnabled ?? true,
  });
}

export async function generateCircularRoute(
  request: GenerateRouteRequest
): Promise<GeneratedRoute> {
  const result = await generateMultipleRoutes({
    ...request,
    loopRoutesOnly: request.loopRoutesOnly ?? true,
  });
  return result.routes[result.selectedIndex];
}

export async function generateMultipleRoutes(
  request: GenerateRouteRequest
): Promise<GenerateRoutesResponse> {
  const loopRoutesOnly = request.loopRoutesOnly ?? true;
  const walkingSpeedKmh = request.walkingSpeedKmh ?? 4.5;
  const targetDistanceM = durationToDistanceMeters(
    request.durationMinutes,
    walkingSpeedKmh
  );

  const recentRain = request.dryFeetEnabled
    ? await getRecentPrecipitation(request.lat, request.lng)
    : { cumulativeRainMm: 0, periodHours: 24 };

  const count = Math.min(
    request.count ?? DEFAULT_ROUTE_COUNT,
    DEFAULT_ROUTE_COUNT
  );

  const routes = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      generateSingleRoute(
        request,
        index,
        targetDistanceM,
        recentRain.cumulativeRainMm,
        loopRoutesOnly
      )
    )
  );

  return { routes, selectedIndex: 0 };
}
