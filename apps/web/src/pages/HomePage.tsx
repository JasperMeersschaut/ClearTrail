import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateRoutes, getGearRecommendation, getOptimalWindow } from '../api';
import { MapView } from '../components/MapView';
import { WeatherWindow } from '../components/WeatherWindow';
import { RoutePanel } from '../components/RoutePanel';
import { GearCard } from '../components/GearCard';
import { AlternativeRoutesList } from '../components/AlternativeRoutesList';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRouteStore } from '../store/routeStore';

export function HomePage() {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const {
    durationMinutes,
    loopRoutesOnly,
    dryFeetEnabled,
    shadePreferenceEnabled,
    searchStartTime,
    searchEndTime,
    routes,
    selectedRouteIndex,
    setDurationMinutes,
    setLoopRoutesOnly,
    setDryFeetEnabled,
    setShadePreferenceEnabled,
    setSearchStartTime,
    setSearchEndTime,
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

  const lat = location?.lat ?? 50.8503;
  const lng = location?.lng ?? 4.3517;

  const findWindowMutation = useMutation({
    mutationFn: () =>
      getOptimalWindow({
        lat,
        lng,
        searchStartTime,
        searchEndTime,
        windowDurationMinutes: durationMinutes,
      }),
  });

  const gearQuery = useQuery({
    queryKey: ['gear', lat, lng],
    queryFn: () => getGearRecommendation(lat, lng),
    enabled: !geoLoading,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateRoutes({
        lat,
        lng,
        durationMinutes,
        loopRoutesOnly,
        dryFeetEnabled,
        shadePreferenceEnabled,
        count: 5,
      }),
    onSuccess: (result) => {
      setRoutes(result.routes, result.selectedIndex);
      findWindowMutation.mutate();
    },
  });

  return (
    <div className="home-layout">
      <div className="map-section">
        <MapView
          center={{ lat, lng }}
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={setSelectedRouteIndex}
        />
        {geoError && <p className="geo-warning">{geoError}</p>}
      </div>

      <aside className="sidebar">
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
        />
        <GearCard gear={gearQuery.data} loading={gearQuery.isLoading} />
        <AlternativeRoutesList
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onSelect={setSelectedRouteIndex}
        />
      </aside>
    </div>
  );
}
