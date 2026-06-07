import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Feature, GeneratedRoute, GpsTrackPoint, LineString } from '@cleartrail/shared';
import { ROUTE_COLORS } from '@cleartrail/shared';
import 'leaflet/dist/leaflet.css';

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-location-pulse"><div class="user-location-dot"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const trailStartIcon = L.divIcon({
  className: 'trail-endpoint-marker trail-start',
  html: '<div class="trail-marker-inner">S</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const trailEndIcon = L.divIcon({
  className: 'trail-endpoint-marker trail-end',
  html: '<div class="trail-marker-inner">E</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface MapViewProps {
  center: { lat: number; lng: number };
  routes: GeneratedRoute[];
  selectedRouteIndex: number;
  onRouteSelect: (index: number) => void;
  gpsTrack?: GpsTrackPoint[] | null;
  plannedRoute?: Feature<LineString> | null;
}

function MapCenterUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.8 });
  }, [center.lat, center.lng, map]);

  return null;
}

function positionsClose(
  a: [number, number],
  b: [number, number],
  tolerance = 0.0003
): boolean {
  return (
    Math.abs(a[0] - b[0]) < tolerance && Math.abs(a[1] - b[1]) < tolerance
  );
}

function geoJsonToLeafletPositions(
  route: Feature<LineString>
): [number, number][] {
  return route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

function isLoopRoute(route: GeneratedRoute): boolean {
  if (route.geojson.properties?.isLoop === true) return true;
  if (route.geojson.properties?.isLoop === false) return false;
  const positions = geoJsonToLeafletPositions(route.geojson);
  if (positions.length < 2) return false;
  return positionsClose(positions[0], positions[positions.length - 1]);
}

function RouteLayer({
  route,
  index,
  isSelected,
  onSelect,
}: {
  route: GeneratedRoute;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}) {
  const positions = geoJsonToLeafletPositions(route.geojson);
  const color = route.color ?? ROUTE_COLORS[index % ROUTE_COLORS.length];
  const opacity = isSelected ? 1 : 0.3;
  const weight = isSelected ? 5 : 3;

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity,
        lineCap: 'round',
        lineJoin: 'round',
      }}
      eventHandlers={{
        click: () => onSelect(index),
      }}
    />
  );
}

export function MapView({
  center,
  routes,
  selectedRouteIndex,
  onRouteSelect,
  gpsTrack = null,
  plannedRoute = null,
}: MapViewProps) {
  const selectedRoute = routes[selectedRouteIndex];
  const selectedPositions = selectedRoute
    ? geoJsonToLeafletPositions(selectedRoute.geojson)
    : [];
  const loopStart = selectedPositions[0];
  const loopEnd = selectedPositions[selectedPositions.length - 1];
  const selectedIsLoop = selectedRoute ? isLoopRoute(selectedRoute) : false;
  const endDistinct =
    loopStart &&
    loopEnd &&
    !positionsClose(loopStart, loopEnd);

  const unselectedRoutes = routes
    .map((route, index) => ({ route, index }))
    .filter(({ index }) => index !== selectedRouteIndex);
  const selectedRouteEntry = routes[selectedRouteIndex]
    ? { route: routes[selectedRouteIndex], index: selectedRouteIndex }
    : null;

  const gpsPositions: [number, number][] =
    gpsTrack?.map((p) => [p.lat, p.lng]) ?? [];
  const ghostPositions = plannedRoute
    ? geoJsonToLeafletPositions(plannedRoute)
    : [];

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="map-container"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenterUpdater center={center} />
      <Marker position={[center.lat, center.lng]} icon={userLocationIcon} />

      {unselectedRoutes.map(({ route, index }) => (
        <RouteLayer
          key={`route-${index}`}
          route={route}
          index={index}
          isSelected={false}
          onSelect={onRouteSelect}
        />
      ))}

      {selectedRouteEntry && (
        <RouteLayer
          route={selectedRouteEntry.route}
          index={selectedRouteEntry.index}
          isSelected
          onSelect={onRouteSelect}
        />
      )}

      {loopStart && (
        <Marker position={loopStart} icon={trailStartIcon} zIndexOffset={500} />
      )}
      {endDistinct && loopEnd && (
        <Marker position={loopEnd} icon={trailEndIcon} zIndexOffset={500} />
      )}
      {selectedIsLoop && loopStart && (
        <CircleMarker
          center={loopStart}
          radius={6}
          pathOptions={{
            color: '#40916c',
            fillColor: '#40916c',
            fillOpacity: 0.85,
            weight: 2,
          }}
        />
      )}

      {ghostPositions.length >= 2 && (
        <Polyline
          positions={ghostPositions}
          pathOptions={{
            color: '#74c69d',
            weight: 3,
            opacity: 0.45,
            dashArray: '8 8',
            lineCap: 'round',
          }}
        />
      )}

      {gpsPositions.length >= 2 && (
        <Polyline
          positions={gpsPositions}
          pathOptions={{
            color: '#2196f3',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
    </MapContainer>
  );
}
