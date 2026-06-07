import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GeneratedRoute } from '@cleartrail/shared';
import { estimateDurationMinutes, formatDistance } from '@cleartrail/shared';
import { saveWalk } from '../api';
import { useAuth } from '../hooks/useAuth';
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
  lat: number;
  lng: number;
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
  lat,
  lng,
}: RoutePanelProps) {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const distanceUnit = useSettingsStore((s) => s.distanceUnit);
  const paceMinPerKm = useSettingsStore((s) => s.paceMinPerKm);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveWalk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-walks'] });
      setSaveMessage('Walk saved to your dashboard.');
    },
    onError: () => setSaveMessage('Could not save walk. Try again.'),
  });

  function handleSaveWalk() {
    if (!route) return;
    const name =
      window.prompt('Name this walk', route.name)?.trim() || route.name;
    saveMutation.mutate({
      name,
      lat,
      lng,
      route: {
        distanceMeters: route.distanceMeters,
        estimatedDurationMin: estimateDurationMinutes(
          route.distanceMeters,
          paceMinPerKm
        ),
        elevationGainM: route.elevationGainM,
        surfaceBreakdown: route.surfaceBreakdown as Record<string, number>,
        scoringMetadata: route.scoringMetadata as Record<string, unknown>,
        geojson: route.geojson,
      },
    });
  }

  return (
    <div className="card">
      <h2>Plan Your Hike</h2>

      <label className="field">
        <span>Target walk length: {durationMinutes} min</span>
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
            ·{' '}
            {route
              ? estimateDurationMinutes(route.distanceMeters, paceMinPerKm)
              : 0}{' '}
            min
          </p>
          {route.elevationGainM != null && (
            <p className="muted">Elevation gain: {route.elevationGainM} m</p>
          )}
          {isLoggedIn ? (
            <button
              type="button"
              className="btn btn-secondary save-walk-btn"
              onClick={handleSaveWalk}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save walk'}
            </button>
          ) : (
            <p className="muted field-hint">Sign in to save walks.</p>
          )}
          {saveMessage && <p className="success-msg">{saveMessage}</p>}
        </div>
      )}
    </div>
  );
}
