import type { OptimalWeatherWindow } from '@cleartrail/shared';

interface WeatherWindowProps {
  window: OptimalWeatherWindow | undefined;
  loading: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WeatherWindow({ window, loading }: WeatherWindowProps) {
  if (loading) {
    return (
      <div className="card">
        <h2>Optimal Start Window</h2>
        <p className="muted">Loading forecast...</p>
      </div>
    );
  }

  if (!window) {
    return (
      <div className="card">
        <h2>Optimal Start Window</h2>
        <p className="muted">Forecast unavailable</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Optimal Start Window</h2>
      <p className="window-time">
        {formatTime(window.startTime)} – {formatTime(window.endTime)}
      </p>
      <p className="summary">{window.summary}</p>
      <div className="score-badge">Score: {Math.round(window.score)}</div>
    </div>
  );
}
