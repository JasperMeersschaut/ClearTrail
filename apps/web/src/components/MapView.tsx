import { useEffect } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Feature, LineString } from '@cleartrail/shared';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    'leaflet/dist/images/marker-icon-2x.png',
    import.meta.url
  ).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url)
    .href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url)
    .href,
});

interface MapViewProps {
  center: { lat: number; lng: number };
  route?: Feature<LineString> | null;
}

function MapCenterUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.8 });
  }, [center.lat, center.lng, map]);

  return null;
}

function geoJsonToLeafletPositions(
  route: Feature<LineString>
): [number, number][] {
  return route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

export function MapView({ center, route }: MapViewProps) {
  const routePositions = route ? geoJsonToLeafletPositions(route) : [];

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
      <Marker position={[center.lat, center.lng]} />
      {routePositions.length > 0 && (
        <>
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#1b4332', weight: 7, opacity: 0.6 }}
          />
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#40916c', weight: 4 }}
          />
        </>
      )}
    </MapContainer>
  );
}
