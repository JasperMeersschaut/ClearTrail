import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateRoutes } from '../api';
import { MapView } from '../components/MapView';
import { RoutePanel } from '../components/RoutePanel';
import { AlternativeRoutesList } from '../components/AlternativeRoutesList';
import { WalkModePanel } from '../components/WalkModePanel';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRouteStore } from '../store/routeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWalkSessionStore } from '../store/walkSessionStore';

export function HomePage() {
  const paceMinPerKm = useSettingsStore((s) => s.paceMinPerKm);
  const { location, error: geoError } = useGeolocation();
  const walkStatus = useWalkSessionStore((s) => s.status);
  const gpsTrack = useWalkSessionStore((s) => s.gpsTrack);
  const plannedRoute = useWalkSessionStore((s) => s.plannedRoute);
  const replayTrack = useWalkSessionStore((s) => s.replayTrack);
  const pendingSavedWalkStart = useWalkSessionStore((s) => s.pendingSavedWalkStart);
  const startWalk = useWalkSessionStore((s) => s.startWalk);
  const clearPendingSavedWalkStart = useWalkSessionStore(
    (s) => s.clearPendingSavedWalkStart
  );
  const setReplayTrack = useWalkSessionStore((s) => s.setReplayTrack);

  const {
    durationMinutes,
    loopRoutesOnly,
    dryFeetEnabled,
    shadePreferenceEnabled,
    routes,
    selectedRouteIndex,
    setDurationMinutes,
    setLoopRoutesOnly,
    setDryFeetEnabled,
    setShadePreferenceEnabled,
    setRoutes,
    setSelectedRouteIndex,
    setUserLocation,
  } = useRouteStore();

  const activeRoute = useRouteStore(
    (s) => s.routes[s.selectedRouteIndex] ?? null
  );

  useEffect(() => {
    if (location) {
      setUserLocation(location);
    }
  }, [location, setUserLocation]);

  useEffect(() => {
    if (!location || !pendingSavedWalkStart || walkStatus !== 'idle') return;
    startWalk({
      startLat: location.lat,
      startLng: location.lng,
      budgetMinutes: pendingSavedWalkStart.budgetMinutes,
      paceMinPerKm: pendingSavedWalkStart.paceMinPerKm,
      plannedRoute: pendingSavedWalkStart.plannedRoute,
      plannedRouteName: pendingSavedWalkStart.plannedRouteName,
      savedRouteId: pendingSavedWalkStart.savedRouteId,
    });
    clearPendingSavedWalkStart();
  }, [
    location,
    pendingSavedWalkStart,
    walkStatus,
    startWalk,
    clearPendingSavedWalkStart,
  ]);

  const lat = location?.lat ?? 50.8503;
  const lng = location?.lng ?? 4.3517;
  const isWalking = walkStatus === 'active' || walkStatus === 'paused';

  const generateMutation = useMutation({
    mutationFn: () =>
      generateRoutes({
        lat,
        lng,
        durationMinutes,
        paceMinPerKm,
        loopRoutesOnly,
        dryFeetEnabled,
        shadePreferenceEnabled,
        count: 5,
      }),
    onSuccess: (result) => {
      setRoutes(result.routes, result.selectedIndex);
    },
  });

  return (
    <div className="home-layout">
      <div className="map-section">
        <MapView
          center={{ lat, lng }}
          routes={isWalking ? [] : routes}
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={setSelectedRouteIndex}
          gpsTrack={isWalking ? gpsTrack : replayTrack}
          plannedRoute={isWalking ? plannedRoute : null}
        />
        {geoError && <p className="geo-warning">{geoError}</p>}
        {isWalking && (
          <div className="walk-recovery-banner">
            Live walk in progress — keep this tab open for GPS tracking.
          </div>
        )}
        {replayTrack && !isWalking && (
          <div className="walk-recovery-banner replay-banner">
            Showing completed walk track.
            <button
              type="button"
              className="btn-link"
              onClick={() => setReplayTrack(null)}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <aside className="sidebar">
        {isWalking || walkStatus === 'idle' ? (
          <WalkModePanel
            activeRoute={activeRoute}
            lat={lat}
            lng={lng}
            targetDurationMinutes={durationMinutes}
          />
        ) : null}

        {!isWalking && (
          <>
            {/* Weather-related features are temporarily disabled.
            <WeatherWindow
              window={findWindowMutation.data}
              loading={findWindowMutation.isPending}
              searchStartTime={searchStartTime}
              searchEndTime={searchEndTime}
              onSearchStartChange={setSearchStartTime}
              onSearchEndChange={setSearchEndTime}
              onFindBestWindow={() => findWindowMutation.mutate()}
              finding={findWindowMutation.isPending}
            />
            */}
            <RoutePanel
              durationMinutes={durationMinutes}
              onDurationChange={setDurationMinutes}
              loopRoutesOnly={loopRoutesOnly}
              onLoopRoutesChange={setLoopRoutesOnly}
              dryFeetEnabled={dryFeetEnabled}
              onDryFeetChange={setDryFeetEnabled}
              shadeEnabled={shadePreferenceEnabled}
              onShadeChange={setShadePreferenceEnabled}
              onGenerate={() => generateMutation.mutate()}
              generating={generateMutation.isPending}
              route={activeRoute}
              selectedRouteIndex={selectedRouteIndex}
              lat={lat}
              lng={lng}
            />
            {/* Gear advisor temporarily disabled.
            <GearCard gear={gearQuery.data} loading={gearQuery.isLoading} />
            */}
            <AlternativeRoutesList
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              onSelect={setSelectedRouteIndex}
            />
          </>
        )}
      </aside>
    </div>
  );
}
