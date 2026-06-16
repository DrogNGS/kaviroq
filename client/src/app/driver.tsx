// client/src/app/driver.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

export default function DriverScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus]         = useState<string>('ready');
  const [loading, setLoading]       = useState(true);
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        const token = await AsyncStorage.getItem('kaviroq_token');
        const socket = io(API_URL, { transports: ['websocket'], auth: { token } });
        socketRef.current = socket;

        socket.on('connect', () => setLoading(false));
        socket.on('connect_error', () => {
          Alert.alert('Erreur', 'Connexion au serveur impossible');
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    };
    connect();
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // Simulation GPS sur web (remplace expo-location)
  const startTracking = () => {
    setIsTracking(true);
    socketRef.current?.emit('update_status', { orderId, status: 'delivering' });
    setStatus('delivering');

    // Simule une position GPS qui bouge lÃ©gÃ¨rement
    const interval = setInterval(() => {
      const lat = 5.354 + (Math.random() - 0.5) * 0.01;
      const lng = -4.007 + (Math.random() - 0.5) * 0.01;
      setCoords({ lat, lng });
      socketRef.current?.emit('location_update', { orderId, lat, lng });
    }, 3000);

    // Stocker l'interval pour pouvoir l'arrÃªter
    (socketRef.current as any)._interval = interval;
  };

  const stopTracking = () => {
    clearInterval((socketRef.current as any)?._interval);
    setIsTracking(false);
    socketRef.current?.emit('update_status', { orderId, status: 'delivered' });
    setStatus('delivered');

    Alert.alert('Livraison confirmÃ©e !', 'La commande a Ã©tÃ© marquÃ©e comme livrÃ©e.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Connexion...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Placeholder carte */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.emoji}>ðŸ›µ</Text>
        <Text style={styles.mapNote}>Carte disponible sur mobile</Text>
        {coords && (
          <Text style={styles.coordsText}>
            Lat : {coords.lat.toFixed(5)}{'\n'}
            Lng : {coords.lng.toFixed(5)}
          </Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.orderId}>
          Commande #{(orderId as string)?.slice(-6).toUpperCase() ?? '------'}
        </Text>

        <View style={[
          styles.statusBadge,
          status === 'delivering' ? styles.badgeOrange :
          status === 'delivered'  ? styles.badgeGreen  : styles.badgeGray
        ]}>
          <Text style={styles.statusText}>
            {status === 'delivering' ? 'ðŸ›µ En livraison'
           : status === 'delivered'  ? 'âœ… LivrÃ©e'
           : 'â³ PrÃªt Ã  partir'}
          </Text>
        </View>

        {!isTracking ? (
          <TouchableOpacity style={styles.btnStart} onPress={startTracking}>
            <Text style={styles.btnText}>DÃ©marrer la livraison</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnStop} onPress={stopTracking}>
            <Text style={styles.btnText}>Confirmer la livraison</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:    { marginTop: 12, color: '#666' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emoji:          { fontSize: 48 },
  mapNote:        { color: '#999', fontSize: 14 },
  coordsText:     { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  orderId:        { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  statusBadge:    { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  badgeOrange:    { backgroundColor: '#FFF0E6' },
  badgeGreen:     { backgroundColor: '#E6F9F0' },
  badgeGray:      { backgroundColor: '#F5F5F5' },
  statusText:     { fontWeight: '600', fontSize: 15, color: '#1a1a1a' },
  btnStart:       { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnStop:        { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText:        { color: '#fff', fontWeight: '700', fontSize: 16 },
});


