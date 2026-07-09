import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebView from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useUserLocation } from "../hooks/useUserLocation";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

interface Business {
  _id: string;
  name: string;
  category: string;
  location: { coordinates: [number, number] };
}

export default function MapScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { location: userLocation } = useUserLocation();

  // Charger les restaurants
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const token = await AsyncStorage.getItem("kaviroq_token");
        const res = await fetch(`${API_URL}/api/businesses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        setBusinesses(data);
        setLoading(false);
      } catch (err) {
        Alert.alert("Erreur", "Impossible de charger les restaurants");
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  // À chaque mise à jour de la position, on met à jour la carte en direct
  useEffect(() => {
    if (mapReady && userLocation && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `window.updateUserLocation(${userLocation.lat}, ${userLocation.lng}); true;`
      );
    }
  }, [mapReady, userLocation]);

  const recenterOnUser = () => {
    if (userLocation && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `window.recenterUser(${userLocation.lat}, ${userLocation.lng}); true;`
      );
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { height: 100%; width: 100%; }

        .user-dot {
          width: 18px;
          height: 18px;
          background: #4285F4;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(66,133,244,0.4);
        }
        .user-dot-pulse {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(66,133,244,0.35);
          position: absolute;
          top: 0;
          left: 0;
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(3); opacity: 0; }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([5.354, -4.007], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const businesses = ${JSON.stringify(businesses)};

        businesses.forEach(b => {
          if (b.location && b.location.coordinates) {
            const [lng, lat] = b.location.coordinates;
            L.marker([lat, lng]).addTo(map)
              .bindPopup(\`<b>\${b.name}</b><br>\${b.category}\`);
          }
        });

        let userMarker = null;
        let hasCenteredOnce = false;
        const ZOOM_CLOSE = 18; // ~ vue rapprochée sur ~100m

        function ensureUserMarker(lat, lng) {
          if (!userMarker) {
            const icon = L.divIcon({
              className: '',
              html: '<div class="user-dot-pulse"></div><div class="user-dot"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            });
            userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
          } else {
            userMarker.setLatLng([lat, lng]);
          }
        }

        // Appelé à chaque mise à jour GPS : suit la position en continu
        window.updateUserLocation = function(lat, lng) {
          ensureUserMarker(lat, lng);
          if (!hasCenteredOnce) {
            map.flyTo([lat, lng], ZOOM_CLOSE, { duration: 1.5 });
            hasCenteredOnce = true;
          } else {
            map.panTo([lat, lng], { animate: true, duration: 0.5 });
          }
        };

        // Appelé par le bouton de recentrage manuel
        window.recenterUser = function(lat, lng) {
          ensureUserMarker(lat, lng);
          map.flyTo([lat, lng], ZOOM_CLOSE, { duration: 1 });
        };

        window.ReactNativeWebView.postMessage('mapReady');
      </script>
    </body>
    </html>
  `;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Restaurants près de vous</Text>
      </View>

      {/* Carte */}
      <View style={styles.mapWrap}>
        <WebView
          ref={webviewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          scalesPageToFit={true}
          onMessage={(event) => {
            if (event.nativeEvent.data === "mapReady") {
              setMapReady(true);
            }
          }}
        />

        {/* Bouton pour recentrer sur l'utilisateur, façon Google Maps */}
        <TouchableOpacity style={styles.locateBtn} onPress={recenterOnUser} activeOpacity={0.8}>
          <Ionicons name="locate" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Liste restaurants */}
      <View style={styles.listPanel}>
        <Text style={styles.listTitle}>{businesses.length} restaurants trouvés</Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {businesses.map(b => (
            <TouchableOpacity
              key={b._id}
              style={styles.listItem}
              onPress={() => {
                setSelectedBusiness(b);
                router.push({
                  pathname: "/business",
                  params: { businessId: b._id, businessName: b.name, category: b.category }
                });
              }}
            >
              <View>
                <Text style={styles.listItemName}>{b.name}</Text>
                <Text style={styles.listItemCategory}>{b.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#fff" },
  centered:       { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText:    { marginTop: 12, color: "#666" },
  header:         { backgroundColor: "#FF6B35", padding: 15, paddingTop: 50, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:        { padding: 4 },
  title:          { color: "#fff", fontSize: 18, fontWeight: "bold" },
  mapWrap:        { position: "relative" },
  map:            { height: 300, width: "100%" },
  locateBtn:      { position: "absolute", bottom: 14, right: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff",
                    alignItems: "center", justifyContent: "center", elevation: 4,
                    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  listPanel:      { flex: 1, backgroundColor: "#f5f5f5", padding: 15 },
  listTitle:      { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  list:           { flex: 1 },
  listContent:    { gap: 8 },
  listItem:       { backgroundColor: "#fff", padding: 15, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 2 },
  listItemName:   { fontSize: 15, fontWeight: "bold", color: "#333" },
  listItemCategory: { fontSize: 12, color: "#999", marginTop: 4 },
});
