import axios from 'axios';
import type { Feature, GenerateRouteRequest, GeneratedRoute, LineString } from '@cleartrail/shared';
import { durationToDistanceMeters } from '@cleartrail/shared';
import { env } from '../config/env.js';
import { getRecentPrecipitation } from './weather.service.js';
import { scoreRoute } from './scoring.service.js';

const ORS_BASE = 'https://api.openrouteservice.org/v2';

function mockCircularRoute(
  lat: number,
  lng: number,
  targetDistanceM: number,
  durationMinutes: number
): GeneratedRoute {
  const radiusDeg = (targetDistanceM / 4) / 111_320;
  const points: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * 2 * Math.PI;
    points.push([
      lng + Math.cos(angle) * radiusDeg,
      lat + Math.sin(angle) * radiusDeg * 0.7,
    ]);
  }
  points.push(points[0]);

  const geojson: Feature<LineString> = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: points },
    properties: { mock: true },
  };

  return {
    name: 'Generated loop',
    distanceMeters: targetDistanceM,
    estimatedDurationMin: durationMinutes,
    elevationGainM: 45,
    surfaceBreakdown: { paved: 0.4, gravel: 0.35, unpaved: 0.25 },
    scoringMetadata: { dryFeetApplied: false, shadePreferenceApplied: false },
    geojson,
  };
}

export async function generateCircularRoute(
  request: GenerateRouteRequest
): Promise<GeneratedRoute> {
  const walkingSpeedKmh = request.walkingSpeedKmh ?? 4.5;
  const targetDistanceM = durationToDistanceMeters(
    request.durationMinutes,
    walkingSpeedKmh
  );

  const recentRain = request.dryFeetEnabled
    ? await getRecentPrecipitation(request.lat, request.lng)
    : { cumulativeRainMm: 0, periodHours: 24 };

  if (!env.OPENROUTESERVICE_API_KEY) {
    const route = mockCircularRoute(
      request.lat,
      request.lng,
      targetDistanceM,
      request.durationMinutes
    );
    return scoreRoute(route, {
      recentRainMm: recentRain.cumulativeRainMm,
      shadePreferenceEnabled: request.shadePreferenceEnabled ?? true,
    });
  }

  const response = await axios.post(
    `${ORS_BASE}/directions/foot-hiking/geojson`,
    {
      coordinates: [[request.lng, request.lat]],
      options: {
        round_trip: {
          length: Math.round(targetDistanceM),
          points: 3,
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

  const feature = response.data.features[0] as Feature<LineString>;
  const distanceMeters =
    response.data.features[0]?.properties?.summary?.distance ?? targetDistanceM;

  const route: GeneratedRoute = {
    name: 'Generated loop',
    distanceMeters,
    estimatedDurationMin: request.durationMinutes,
    surfaceBreakdown: {},
    scoringMetadata: {},
    geojson: feature,
  };

  return scoreRoute(route, {
    recentRainMm: recentRain.cumulativeRainMm,
    shadePreferenceEnabled: request.shadePreferenceEnabled ?? true,
  });
}
