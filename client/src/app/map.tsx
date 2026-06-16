import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebView from "react-native-webview";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

interface Business {
  _id: string;
  name: string;
  category: string;
  location: { coordinates: [number, number] };
}

export default function MapScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

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
            const marker = L.marker([lat, lng]).addTo(map)
              .bindPopup(\`<b>\${b.name}</b><br>\${b.category}\`);
          }
        });
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
          <Text style={styles.backText}>â†</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Restaurants prÃ¨s de vous</Text>
      </View>

      {/* Carte */}
      <WebView
        source={{ html: mapHtml }}
        style={styles.map}
        scalesPageToFit={true}
      />

      {/* Liste restaurants */}
      <View style={styles.listPanel}>
        <Text style={styles.listTitle}>{businesses.length} restaurants trouvÃ©s</Text>
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
              <Text style={styles.listItemArrow}>â†’</Text>
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
  backText:       { color: "#fff", fontSize: 22 },
  title:          { color: "#fff", fontSize: 18, fontWeight: "bold" },
  map:            { height: 300, width: "100%" },
  listPanel:      { flex: 1, backgroundColor: "#f5f5f5", padding: 15 },
  listTitle:      { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  list:           { flex: 1 },
  listContent:    { gap: 8 },
  listItem:       { backgroundColor: "#fff", padding: 15, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 2 },
  listItemName:   { fontSize: 15, fontWeight: "bold", color: "#333" },
  listItemCategory: { fontSize: 12, color: "#999", marginTop: 4 },
  listItemArrow:  { fontSize: 18, color: "#FF6B35" },
});

