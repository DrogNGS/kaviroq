import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  lat:       number | null;
  lng:       number | null;
  isLoading: boolean;
  error:     string | null;
  commune:   string | null;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    lat: null, lng: null, isLoading: true, error: null, commune: null,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({
          isLoading: false,
          error: 'Permission de localisation refusée.',
          lat: 5.3364,
          lng: -4.0267,
          commune: 'Abidjan',
        });
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const [geo] = await Location.reverseGeocodeAsync({
          latitude:  loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setState({
          lat:       loc.coords.latitude,
          lng:       loc.coords.longitude,
          isLoading: false,
          error:     null,
          commune:   geo?.district ?? geo?.city ?? 'Abidjan',
        });
      } catch (e: any) {
        setState({
          isLoading: false,
          error:     e.message ?? 'Impossible d\'obtenir la position.',
          lat:       5.3364,
          lng:      -4.0267,
          commune:   'Abidjan',
        });
      }
    })();
  }, []);

  return state;
}