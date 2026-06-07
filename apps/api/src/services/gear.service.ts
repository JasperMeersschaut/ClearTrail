import type { GearRecommendation, OptimalWeatherWindow } from '@cleartrail/shared';

function windForceDescription(kmh: number): string {
  if (kmh < 12) return 'light breeze';
  if (kmh < 20) return 'moderate wind';
  if (kmh < 30) return 'fresh wind (force 4–5)';
  return 'strong wind — consider postponing exposed routes';
}

export function getGearRecommendation(
  window: Pick<OptimalWeatherWindow, 'forecast' | 'startTime' | 'endTime'>
): GearRecommendation {
  const start = new Date(window.startTime).getTime();
  const end = new Date(window.endTime).getTime();
  const relevant = window.forecast.filter((h) => {
    const t = new Date(h.time).getTime();
    return t >= start && t <= end;
  });

  const hours = relevant.length > 0 ? relevant : window.forecast.slice(0, 3);
  const avgTemp = hours.reduce((s, h) => s + h.temperature, 0) / hours.length;
  const maxPrecip = Math.max(...hours.map((h) => h.precipitationProbability));
  const avgWind = hours.reduce((s, h) => s + h.windSpeed, 0) / hours.length;
  const maxUv = Math.max(...hours.map((h) => h.uvIndex ?? 0));

  const layers: string[] = ['moisture-wicking base layer'];
  const bring: string[] = [];
  const notes: string[] = [];

  if (avgTemp < 10) {
    layers.push('insulating mid-layer', 'warm outer layer');
    bring.push('gloves', 'beanie');
  } else if (avgTemp < 16) {
    layers.push('light fleece or mid-layer');
    bring.push('packable jacket');
  } else if (avgTemp > 22) {
    layers.push('breathable shirt');
    bring.push('sun hat', 'sunglasses');
    notes.push('High temperature expected — prioritize shaded segments');
  }

  if (avgWind >= 15) {
    bring.push('windbreaker');
    notes.push(`${windForceDescription(avgWind)} expected on open fields`);
  }

  if (maxPrecip >= 40) {
    bring.push('waterproof jacket', 'rain cover for pack');
    notes.push('Rain likely during your hiking window');
  } else if (maxPrecip >= 20) {
    bring.push('light rain shell');
  }

  if (maxUv >= 6) {
    bring.push('sunscreen SPF 30+');
    notes.push('High UV index — reapply sunscreen every 2 hours');
  }

  return { layers, bring, notes };
}
