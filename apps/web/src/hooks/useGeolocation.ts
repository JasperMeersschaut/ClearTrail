import { useEffect, useState } from 'react';
import type { LatLng } from '@cleartrail/shared';

interface GeolocationState {
  location: LatLng | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: { lat: 50.8503, lng: 4.3517 },
        error: 'Geolocation unavailable — using default (Brussels)',
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          location: { lat: 50.8503, lng: 4.3517 },
          error: err.message,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return state;
}
