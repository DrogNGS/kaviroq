import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

export interface UserCoords {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserCoords | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const start = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted) setPermissionDenied(true);
          return;
        }

        // Position initiale immédiate
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (isMounted) {
          setLocation({ lat: initial.coords.latitude, lng: initial.coords.longitude });
        }

        // Puis suivi continu (comme Uber) : mise à jour tous les 3s ou tous les 5m parcourus
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 20,
          },
          (position) => {
            if (isMounted) {
              setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            }
          }
        );
      } catch (err) {
        console.log("Erreur géolocalisation continue:", err);
      }
    };

    start();

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  return { location, permissionDenied };
}