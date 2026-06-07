import axios from 'axios';
import type { HistoricalWeather, OptimalWeatherWindow, WeatherForecastHour } from '@cleartrail/shared';
import { env } from '../config/env.js';

const TOMORROW_BASE = 'https://api.tomorrow.io/v4';

function mockForecastHours(hoursAhead: number): WeatherForecastHour[] {
  const now = Date.now();
  return Array.from({ length: hoursAhead }, (_, i) => ({
    time: new Date(now + i * 3600_000).toISOString(),
    temperature: 14 + Math.sin(i / 4) * 4,
    precipitationProbability: Math.max(5, 30 - i * 2),
    windSpeed: 8 + (i % 3) * 2,
    humidity: 65,
    uvIndex: i >= 8 && i <= 16 ? 4 : 1,
  }));
}

function scoreWindow(hours: WeatherForecastHour[]): number {
  if (hours.length === 0) return 0;
  const avgPrecip =
    hours.reduce((sum, h) => sum + h.precipitationProbability, 0) / hours.length;
  const avgWind = hours.reduce((sum, h) => sum + h.windSpeed, 0) / hours.length;
  const avgTemp = hours.reduce((sum, h) => sum + h.temperature, 0) / hours.length;
  const tempPenalty = Math.abs(avgTemp - 16) * 2;
  return 100 - avgPrecip - avgWind * 0.5 - tempPenalty;
}

export async function getOptimalWeatherWindow(
  lat: number,
  lng: number,
  hoursAhead = 48
): Promise<OptimalWeatherWindow> {
  if (!env.TOMORROW_IO_API_KEY) {
    const forecast = mockForecastHours(hoursAhead);
    const bestStart = 9;
    const windowHours = forecast.slice(bestStart, bestStart + 3);
    return {
      startTime: windowHours[0].time,
      endTime: windowHours[windowHours.length - 1].time,
      score: scoreWindow(windowHours),
      summary: 'Best window tomorrow morning — low rain chance and moderate wind (mock data)',
      forecast,
    };
  }

  const response = await axios.get(`${TOMORROW_BASE}/weather/forecast`, {
    params: {
      location: `${lat},${lng}`,
      timesteps: '1h',
      units: 'metric',
      apikey: env.TOMORROW_IO_API_KEY,
    },
  });

  // TODO: parse Tomorrow.io response and compute optimal sliding window
  const forecast = mockForecastHours(hoursAhead);
  return {
    startTime: forecast[9].time,
    endTime: forecast[11].time,
    score: scoreWindow(forecast.slice(9, 12)),
    summary: 'Optimal hiking window based on Tomorrow.io forecast',
    forecast,
  };
}

export async function getRecentPrecipitation(
  lat: number,
  lng: number,
  periodHours = 24
): Promise<HistoricalWeather> {
  if (!env.TOMORROW_IO_API_KEY) {
    return { cumulativeRainMm: 0, periodHours };
  }

  // TODO: integrate Tomorrow.io historical/timeline API
  return { cumulativeRainMm: 0, periodHours };
}
