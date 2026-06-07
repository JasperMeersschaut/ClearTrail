import type { GeneratedRoute } from '@cleartrail/shared';
import { formatDistance } from '@cleartrail/shared';
import { useSettingsStore } from '../store/settingsStore';

interface RoutePanelProps {
  durationMinutes: number;
  onDurationChange: (minutes: number) => void;
  loopRoutesOnly: boolean;
  onLoopRoutesChange: (enabled: boolean) => void;
  dryFeetEnabled: boolean;
  onDryFeetChange: (enabled: boolean) => void;
  shadeEnabled: boolean;
  onShadeChange: (enabled: boolean) => void;
  onGenerate: () => void;
  generating: boolean;
  route: GeneratedRoute | null;
  selectedRouteIndex: number;
}

export function RoutePanel({
  durationMinutes,
  onDurationChange,
  loopRoutesOnly,
  onLoopRoutesChange,
  dryFeetEnabled,
  onDryFeetChange,
  shadeEnabled,
  onShadeChange,
  onGenerate,
  generating,
  route,
}: RoutePanelProps) {
  const distanceUnit = useSettingsStore((s) => s.distanceUnit);

  return (
    <div className="card">
      <h2>Plan Your Hike</h2>

      <label className="field">
        <span>Duration: {durationMinutes} min</span>
        <input
          type="range"
          min={15}
          max={240}
          step={15}
          value={durationMinutes}
          onChange={(e) => onDurationChange(Number(e.target.value))}
        />
      </label>

      <label className="checkbox checkbox-toggle">
        <input
          type="checkbox"
          checked={loopRoutesOnly}
          onChange={(e) => onLoopRoutesChange(e.target.checked)}
        />
        Loop routes only
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={dryFeetEnabled}
          onChange={(e) => onDryFeetChange(e.target.checked)}
        />
        Dry Feet (avoid muddy trails after rain)
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={shadeEnabled}
          onChange={(e) => onShadeChange(e.target.checked)}
        />
        Sun &amp; shadow optimization
      </label>

      <button
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate Route'}
      </button>

      {route && (
        <div className="route-stats selected-route-stats">
          <h3>{route.name} (Selected)</h3>
          <p>
            <strong>
              {formatDistance(route.distanceMeters, distanceUnit)}
            </strong>{' '}
            · {route.estimatedDurationMin} min
          </p>
          {route.elevationGainM != null && (
            <p className="muted">Elevation gain: {route.elevationGainM} m</p>
          )}
        </div>
      )}
    </div>
  );
}
