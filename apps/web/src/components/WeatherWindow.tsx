import type { OptimalWeatherWindow } from '@cleartrail/shared';
import { formatDateTime } from '@cleartrail/shared';
import { useSettingsStore } from '../store/settingsStore';

interface WeatherWindowProps {
  window: OptimalWeatherWindow | undefined;
  loading: boolean;
  searchStartTime: string;
  searchEndTime: string;
  onSearchStartChange: (iso: string) => void;
  onSearchEndChange: (iso: string) => void;
  onFindBestWindow: () => void;
  finding: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toLocalDateValue(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalTimeValue(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combineDateTime(dateValue: string, timeValue: string): string {
  return new Date(`${dateValue}T${timeValue}`).toISOString();
}

export function WeatherWindow({
  window,
  loading,
  searchStartTime,
  searchEndTime,
  onSearchStartChange,
  onSearchEndChange,
  onFindBestWindow,
  finding,
}: WeatherWindowProps) {
  const settings = useSettingsStore();

  const formatDisplay = (iso: string) =>
    formatDateTime(iso, {
      timeFormat: settings.timeFormat,
      dateFormat: settings.dateFormat,
    });

  return (
    <div className="card">
      <h2>Optimal Start Window</h2>
      <p className="muted window-hint">
        Pick a weekend date and keep the search window inside your preferred hiking hours.
      </p>

      <div className="window-grid">
        <label className="field">
          <span>Start date</span>
          <input
            type="date"
            value={toLocalDateValue(searchStartTime)}
            onChange={(e) =>
              onSearchStartChange(
                combineDateTime(e.target.value, toLocalTimeValue(searchStartTime))
              )
            }
          />
        </label>

        <label className="field">
          <span>Start time</span>
          <input
            type="time"
            value={toLocalTimeValue(searchStartTime)}
            onChange={(e) =>
              onSearchStartChange(
                combineDateTime(toLocalDateValue(searchStartTime), e.target.value)
              )
            }
          />
        </label>

        <label className="field">
          <span>End date</span>
          <input
            type="date"
            value={toLocalDateValue(searchEndTime)}
            onChange={(e) =>
              onSearchEndChange(
                combineDateTime(e.target.value, toLocalTimeValue(searchEndTime))
              )
            }
          />
        </label>

        <label className="field">
          <span>End time</span>
          <input
            type="time"
            value={toLocalTimeValue(searchEndTime)}
            onChange={(e) =>
              onSearchEndChange(
                combineDateTime(toLocalDateValue(searchEndTime), e.target.value)
              )
            }
          />
        </label>
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onFindBestWindow}
        disabled={finding}
      >
        {finding ? 'Searching...' : 'Find Best Window'}
      </button>

      {loading && <p className="muted">Loading forecast...</p>}

      {!loading && window && (
        <>
          <p className="window-time">
            {formatDisplay(window.startTime)} – {formatDisplay(window.endTime)}
          </p>
          <p className="summary">{window.summary}</p>
          <div className="score-badge">Score: {Math.round(window.score)}</div>
        </>
      )}

      {!loading && !window && (
        <p className="muted">Click &quot;Find Best Window&quot; to search.</p>
      )}
    </div>
  );
}
