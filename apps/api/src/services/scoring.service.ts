import type { GeneratedRoute, ScoringMetadata, SurfaceBreakdown } from '@cleartrail/shared';

interface ScoringContext {
  recentRainMm: number;
  shadePreferenceEnabled: boolean;
}

const RAIN_THRESHOLD_MM = 5;

function getSeason(): ScoringMetadata['season'] {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  return 'autumn';
}

function applyDryFeet(
  breakdown: SurfaceBreakdown,
  recentRainMm: number
): { breakdown: SurfaceBreakdown; metadata: Partial<ScoringMetadata> } {
  if (recentRainMm < RAIN_THRESHOLD_MM) {
    return { breakdown, metadata: { dryFeetApplied: false } };
  }

  const adjusted: SurfaceBreakdown = {
    paved: (breakdown.paved ?? 0) * 1.4,
    gravel: (breakdown.gravel ?? 0) * 1.2,
    unpaved: (breakdown.unpaved ?? 0) * 0.2,
    unknown: breakdown.unknown,
  };

  return {
    breakdown: adjusted,
    metadata: {
      dryFeetApplied: true,
      weights: { unpavedPenalty: 0.8, pavedBonus: 0.4 },
    },
  };
}

function applyShadePreference(
  breakdown: SurfaceBreakdown,
  season: ScoringMetadata['season'],
  enabled: boolean
): Partial<ScoringMetadata> {
  if (!enabled) return { shadePreferenceApplied: false };

  if (season === 'summer') {
    return {
      shadePreferenceApplied: true,
      season,
      weights: { forestBoost: 0.3, exposedPenalty: 0.2 },
    };
  }

  if (season === 'winter') {
    return {
      shadePreferenceApplied: true,
      season,
      weights: { exposedBoost: 0.3, forestPenalty: 0.1 },
    };
  }

  return { shadePreferenceApplied: true, season };
}

export function scoreRoute(
  route: GeneratedRoute,
  context: ScoringContext
): GeneratedRoute {
  const season = getSeason();
  const baseBreakdown: SurfaceBreakdown =
    Object.keys(route.surfaceBreakdown).length > 0
      ? route.surfaceBreakdown
      : { paved: 0.33, gravel: 0.33, unpaved: 0.34 };

  const dryFeet = applyDryFeet(baseBreakdown, context.recentRainMm);
  const shade = applyShadePreference(
    dryFeet.breakdown,
    season,
    context.shadePreferenceEnabled
  );

  return {
    ...route,
    surfaceBreakdown: dryFeet.breakdown,
    scoringMetadata: {
      ...route.scoringMetadata,
      ...dryFeet.metadata,
      ...shade,
    },
  };
}
