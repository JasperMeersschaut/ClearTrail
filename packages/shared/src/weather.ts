export interface WeatherForecastHour {
  time: string;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  humidity: number;
  uvIndex?: number;
}

export interface OptimalWeatherWindow {
  startTime: string;
  endTime: string;
  score: number;
  summary: string;
  forecast: WeatherForecastHour[];
}

export interface WeatherWindowRequest {
  lat: number;
  lng: number;
  hoursAhead?: number;
}

export interface HistoricalWeather {
  cumulativeRainMm: number;
  periodHours: number;
}
