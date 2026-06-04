// client/src/app/tracking.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const STATUS_LABELS: Record<string, string> = {
  pending:    'En attente de confirmation...',
  accepted:   'Commande acceptÃ©e !',
  preparing:  'En prÃ©paration...',
  ready:      'PrÃªte â€” livreur en route',
  delivering: 'Livreur en chemin',
  delivered:  'LivrÃ©e !',
};

const STATUS_STEPS = ['accepted', 'preparing', 'ready', 'delivering', 'delivered'];

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef<Socket | null>(null);

  const [orderStatus, setOrderStatus] = useState<string>('accepted');
  const [eta, setEta]                 = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [driverPos, setDriverPos]     = useState<{ lat: number; lng: number } | null>(null);

  // Animation pulse sur l'icÃ´ne livreur
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const connect = async () => {
      try {
        const token = await AsyncStorage.getItem('kaviroq_token');
        if (!token) { router.replace('/login'); return; }

        const socket = io(API_URL, {
          transports: ['websocket'],
          auth: { token },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join_order', { orderId, token });
          setLoading(false);
        });

        socket.on('connect_error', () => {
          setError('Impossible de se connecter au serveur');
          setLoading(false);
        });

        socket.on('location_update', ({ lat, lng }) => {
          setDriverPos({ lat, lng });
        });

        socket.on('order_status', ({ status, eta: newEta }) => {
          setOrderStatus(status);
          if (newEta) setEta(newEta);
          if (status === 'delivered') {
            setTimeout(() => router.replace('/'), 3000);
          }
        });

        socket.on('error', ({ message }) => setError(message));

      } catch {
        setError('Erreur de connexion');
        setLoading(false);
      }
    };

    connect();
    return () => { socketRef.current?.disconnect(); };
  }, [orderId]);

  const currentStep = STATUS_STEPS.indexOf(orderStatus);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Connexion au suivi...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Placeholder carte */}
      <View style={styles.mapPlaceholder}>
        <Animated.Text style={[styles.driverEmoji, { transform: [{ scale: pulseAnim }] }]}>
          ðŸ›µ
        </Animated.Text>
        {driverPos ? (
          <Text style={styles.coordsText}>
            Position : {driverPos.lat.toFixed(4)}, {driverPos.lng.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.mapNote}>Carte disponible sur mobile</Text>
        )}
      </View>

      {/* Panel bas */}
      <View style={styles.panel}>

        {eta && orderStatus === 'delivering' && (
          <View style={styles.etaRow}>
            <Text style={styles.etaLabel}>ArrivÃ©e estimÃ©e</Text>
            <Text style={styles.etaValue}>{eta}</Text>
          </View>
        )}

        <Text style={styles.statusText}>
          {STATUS_LABELS[orderStatus] ?? orderStatus}
        </Text>

        {/* Barre de progression */}
        <View style={styles.stepsRow}>
          {STATUS_STEPS.map((step, i) => (
            <View key={step} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                i <= currentStep && styles.stepDotActive,
                i === currentStep && styles.stepDotCurrent,
              ]} />
              {i < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Voir ma commande</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText:    { marginTop: 12, color: '#666', fontSize: 15 },
  errorText:      { color: '#E24B4A', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn:       { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText:      { color: '#fff', fontWeight: '600' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  driverEmoji:    { fontSize: 48 },
  coordsText:     { color: '#555', fontSize: 13 },
  mapNote:        { color: '#999', fontSize: 14 },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  etaRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  etaLabel:       { color: '#888', fontSize: 13 },
  etaValue:       { color: '#F97316', fontWeight: '700', fontSize: 15 },
  statusText:     { fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' },
  stepsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd' },
  stepDotActive:  { backgroundColor: '#F97316' },
  stepDotCurrent: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#F97316', backgroundColor: '#fff' },
  stepLine:       { width: 36, height: 2, backgroundColor: '#ddd' },
  stepLineActive: { backgroundColor: '#F97316' },
  backBtn:        { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backText:       { color: '#fff', fontWeight: '700', fontSize: 15 },
});

