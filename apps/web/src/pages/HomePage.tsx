import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateRoute, getGearRecommendation, getOptimalWindow } from '../api';
import { MapView } from '../components/MapView';
import { WeatherWindow } from '../components/WeatherWindow';
import { RoutePanel } from '../components/RoutePanel';
import { GearCard } from '../components/GearCard';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRouteStore } from '../store/routeStore';

export function HomePage() {
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const {
    durationMinutes,
    dryFeetEnabled,
    shadePreferenceEnabled,
    activeRoute,
    setDurationMinutes,
    setDryFeetEnabled,
    setShadePreferenceEnabled,
    setActiveRoute,
    setUserLocation,
  } = useRouteStore();

  useEffect(() => {
    if (location) {
      setUserLocation(location);
    }
  }, [location, setUserLocation]);

  const lat = location?.lat ?? 50.8503;
  const lng = location?.lng ?? 4.3517;

  const weatherQuery = useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => getOptimalWindow(lat, lng),
    enabled: !geoLoading,
  });

  const gearQuery = useQuery({
    queryKey: ['gear', lat, lng],
    queryFn: () => getGearRecommendation(lat, lng),
    enabled: !geoLoading,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateRoute({
        lat,
        lng,
        durationMinutes,
        dryFeetEnabled,
        shadePreferenceEnabled,
      }),
    onSuccess: (route) => setActiveRoute(route),
  });

  return (
    <div className="home-layout">
      <div className="map-section">
        <MapView center={{ lat, lng }} route={activeRoute?.geojson ?? null} />
        {geoError && <p className="geo-warning">{geoError}</p>}
      </div>

      <aside className="sidebar">
        <WeatherWindow
          window={weatherQuery.data}
          loading={weatherQuery.isLoading}
        />
        <RoutePanel
          durationMinutes={durationMinutes}
          onDurationChange={setDurationMinutes}
          dryFeetEnabled={dryFeetEnabled}
          onDryFeetChange={setDryFeetEnabled}
          shadeEnabled={shadePreferenceEnabled}
          onShadeChange={setShadePreferenceEnabled}
          onGenerate={() => generateMutation.mutate()}
          generating={generateMutation.isPending}
          route={activeRoute}
        />
        <GearCard gear={gearQuery.data} loading={gearQuery.isLoading} />
        <p className="auth-links">
          <Link to="/dashboard">Dashboard</Link> ·{' '}
          <Link to="/login">Login</Link>
        </p>
      </aside>
    </div>
  );
}
