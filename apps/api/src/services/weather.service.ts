import axios from 'axios';
import type {
  HistoricalWeather,
  OptimalWeatherWindow,
  WeatherForecastHour,
} from '@cleartrail/shared';
import { env } from '../config/env.js';

const TOMORROW_BASE = 'https://api.tomorrow.io/v4';
const DEFAULT_WINDOW_HOURS = 3;

function mockForecastForRange(
  searchStart: Date,
  searchEnd: Date
): WeatherForecastHour[] {
  const hours: WeatherForecastHour[] = [];
  const cursor = new Date(searchStart);
  let i = 0;

  while (cursor <= searchEnd) {
    hours.push({
      time: cursor.toISOString(),
      temperature: 14 + Math.sin(i / 4) * 4,
      precipitationProbability: Math.max(5, 35 - (i % 12) * 3),
      windSpeed: 8 + (i % 3) * 2,
      humidity: 65,
      uvIndex: cursor.getHours() >= 8 && cursor.getHours() <= 16 ? 4 : 1,
    });
    cursor.setHours(cursor.getHours() + 1);
    i++;
  }

  return hours;
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

function findBestWindowInForecast(
  forecast: WeatherForecastHour[],
  searchStart: Date,
  searchEnd: Date,
  windowDurationMinutes: number
): { startTime: string; endTime: string; score: number; windowHours: WeatherForecastHour[] } | null {
  const windowHoursCount = Math.max(1, Math.ceil(windowDurationMinutes / 60));
  const inRange = forecast.filter((h) => {
    const t = new Date(h.time);
    return t >= searchStart && t <= searchEnd;
  });

  if (inRange.length === 0) return null;

  let bestScore = -Infinity;
  let bestStart = 0;

  for (let i = 0; i <= inRange.length - windowHoursCount; i++) {
    const slice = inRange.slice(i, i + windowHoursCount);
    const score = scoreWindow(slice);
    if (score > bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }

  const windowHours = inRange.slice(bestStart, bestStart + windowHoursCount);
  if (windowHours.length === 0) return null;

  return {
    startTime: windowHours[0].time,
    endTime: windowHours[windowHours.length - 1].time,
    score: bestScore,
    windowHours,
  };
}

export async function getOptimalWeatherWindow(
  lat: number,
  lng: number,
  options: {
    searchStartTime?: string;
    searchEndTime?: string;
    windowDurationMinutes?: number;
    hoursAhead?: number;
  } = {}
): Promise<OptimalWeatherWindow> {
  const now = new Date();
  const searchStart = options.searchStartTime
    ? new Date(options.searchStartTime)
    : now;
  const searchEnd = options.searchEndTime
    ? new Date(options.searchEndTime)
    : new Date(now.getTime() + (options.hoursAhead ?? 48) * 3600_000);
  const windowDurationMinutes =
    options.windowDurationMinutes ?? DEFAULT_WINDOW_HOURS * 60;

  const spanHours = Math.ceil(
    (searchEnd.getTime() - searchStart.getTime()) / 3600_000
  );

  if (!env.TOMORROW_IO_API_KEY) {
    const forecast = mockForecastForRange(searchStart, searchEnd);
    const best = findBestWindowInForecast(
      forecast,
      searchStart,
      searchEnd,
      windowDurationMinutes
    );

    if (!best) {
      return {
        startTime: searchStart.toISOString(),
        endTime: searchEnd.toISOString(),
        score: 0,
        summary: 'No forecast data in the selected time span',
        forecast: [],
      };
    }

    return {
      startTime: best.startTime,
      endTime: best.endTime,
      score: best.score,
      summary: `Best ${windowDurationMinutes}-minute window in your search span — low rain and moderate wind (mock data)`,
      forecast,
    };
  }

  const response = await axios.get(`${TOMORROW_BASE}/weather/forecast`, {
    params: {
      location: `${lat},${lng}`,
      timesteps: '1h',
      units: 'metric',
      apikey: env.TOMORROW_IO_API_KEY,
      startTime: searchStart.toISOString(),
      endTime: searchEnd.toISOString(),
    },
  });

  // Parse Tomorrow.io hourly intervals when available; fall back to mock slice
  const intervals =
    response.data?.timelines?.hourly?.[0]?.intervals ??
    response.data?.data?.timelines?.[0]?.intervals;

  let forecast: WeatherForecastHour[];

  if (intervals?.length) {
    forecast = intervals.map(
      (interval: { startTime: string; values: Record<string, number> }) => ({
        time: interval.startTime,
        temperature: interval.values.temperature ?? 15,
        precipitationProbability:
          interval.values.precipitationProbability ?? 20,
        windSpeed: interval.values.windSpeed ?? 10,
        humidity: interval.values.humidity ?? 60,
        uvIndex: interval.values.uvIndex,
      })
    );
  } else {
    forecast = mockForecastForRange(searchStart, searchEnd);
  }

  const best = findBestWindowInForecast(
    forecast,
    searchStart,
    searchEnd,
    windowDurationMinutes
  );

  if (!best) {
    return {
      startTime: searchStart.toISOString(),
      endTime: searchEnd.toISOString(),
      score: 0,
      summary: 'No suitable window found in the selected time span',
      forecast,
    };
  }

  return {
    startTime: best.startTime,
    endTime: best.endTime,
    score: best.score,
    summary: `Optimal ${windowDurationMinutes}-minute hiking window within your search span`,
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

  return { cumulativeRainMm: 0, periodHours };
}
