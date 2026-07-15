import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant", icon: "🍔" },
  { value: "hotel",      label: "Hotel",       icon: "🏨" },
  { value: "patisserie", label: "Patisserie",  icon: "🎂" },
  { value: "maquis",    label: "Maquis",      icon: "🏖" },
  { value: "salon",     label: "Salon",       icon: "💇" },
  { value: "fast_food", label: "Fast Food",   icon: "🍟" },
  { value: "cafe",      label: "Cafe",        icon: "☕" },
  { value: "commerce",  label: "Commerce",    icon: "🛒" },
];

export default function SetupBusinessScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (step === 2 && !coords) { getMyLocation(); }
  }, [step]);

  const getMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusee", "Activez la geolocalisation.");
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo.length > 0) {
        const g = geo[0];
        const addr = [g.street, g.district, g.city].filter(Boolean).join(", ");
        if (!address) setAddress(addr);
      }
      Alert.alert("Position detectee", "Votre position a ete enregistree !");
    } catch {
      Alert.alert("Erreur", "Impossible de detecter votre position.");
    } finally {
      setLocating(false);
    }
  };

  const MapPicker = () => {
    const mapHtml = `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body{margin:0}#map{height:100vh}</style>
    </head><body>
      <div id="map"></div>
      <script>
        var lat=${coords?.lat || 5.345317}, lng=${coords?.lng || -4.024429};
        var map=L.map("map").setView([lat,lng],15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        var marker=L.marker([lat,lng],{draggable:true}).addTo(map);
        marker.on("dragend",function(e){
          var pos=e.target.getLatLng();
          var msg={type:"position",lat:pos.lat,lng:pos.lng};
          if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(msg));
          else window.parent.postMessage(msg,"*");
        });
        map.on("click",function(e){
          marker.setLatLng(e.latlng);
          var msg={type:"position",lat:e.latlng.lat,lng:e.latlng.lng};
          if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(msg));
          else window.parent.postMessage(msg,"*");
        });
      </script>
    </body></html>`;

    if (Platform.OS === "web") {
      return (
        <iframe srcDoc={mapHtml} style={{ width: "100%", height: "100%", border: "none" } as any}
          onLoad={() => { window.addEventListener("message", (e) => {
            if (e.data?.type === "position") setCoords({ lat: e.data.lat, lng: e.data.lng });
          }); }} />
      );
    }
    const { WebView } = require("react-native-webview");
    return (
      <WebView source={{ html: mapHtml }} style={{ flex: 1 }}
        onMessage={(e: any) => {
          try { const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "position") setCoords({ lat: data.lat, lng: data.lng });
          } catch {}
        }} />
    );
  };
  

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert("Erreur", "Le nom est requis."); return; }
    if (!category) { Alert.alert("Erreur", "Choisissez une categorie."); return; }
    const finalCoords = coords || { lat: 5.345317, lng: -4.024429 };
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { Alert.alert("Session expiree", "Veuillez vous reconnecter."); router.replace("/login"); return; }
      const res = await fetch(`${API_URL}/businesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, category, description, address, phone,
          location: { type: "Point", coordinates: [finalCoords.lng, finalCoords.lat] } }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        Alert.alert("Erreur", errorData?.message || "Impossible de creer l'entreprise."); return;
      }
      router.replace("/dashboard");
    } catch (err) {
      Alert.alert("Erreur", "Verifiez votre connexion.");
    } finally { setLoading(false); }
  };

  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Creer mon entreprise</Text>
          <Text style={styles.subtitle}>Etape 1/2 - Informations</Text>
        </View>
        <Text style={styles.label}>Nom de l'entreprise *</Text>
        <TextInput style={styles.input} placeholder="Ex: Restaurant Chez Kouassi" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
        <Text style={styles.label}>Categorie *</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.value} style={[styles.catCard, category === cat.value && styles.catCardActive]} onPress={() => setCategory(cat.value)}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, category === cat.value && styles.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.inputMulti]} placeholder="Decrivez votre entreprise..." placeholderTextColor="#aaa" value={description} onChangeText={setDescription} multiline />
        <Text style={styles.label}>Adresse</Text>
        <TextInput style={styles.input} placeholder="Ex: Cocody, Abidjan" placeholderTextColor="#aaa" value={address} onChangeText={setAddress} />
        <Text style={styles.label}>Telephone</Text>
        <TextInput style={styles.input} placeholder="Ex: +225 07 00 00 00" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TouchableOpacity style={[styles.btn, !name || !category ? styles.btnDisabled : {}]} onPress={() => setStep(2)} disabled={!name || !category}>
          <Text style={styles.btnText}>Suivant - Positionner sur la carte</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Text style={styles.backBtn}>Retour</Text>
        </TouchableOpacity>
        {coords && <Text style={styles.coordsText}>Position: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</Text>}
      </View>
      <View style={styles.mapContainer}><MapPicker /></View>
      <Text style={styles.mapHint}>Appuyez sur la carte ou glissez le marqueur</Text>
      <TouchableOpacity style={[styles.btn, styles.btnCreate, loading ? styles.btnDisabled : {}]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Creer mon entreprise</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#0f0c29" },
  content:        { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header:         { padding: 20, paddingTop: 60, paddingBottom: 16 },
  title:          { fontSize: 24, fontWeight: "800", color: "#fff" },
  subtitle:       { fontSize: 13, color: "#aaa", marginTop: 4 },
  backBtn:        { color: "#FF6B35", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  label:          { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 8, marginTop: 4 },
  input:          { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 14, fontSize: 15, color: "#fff", marginBottom: 16 },
  inputMulti:     { minHeight: 80, textAlignVertical: "top" },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  catCard:        { width: "22%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)" },
  catCardActive:  { borderColor: "#FF6B35", backgroundColor: "rgba(255,107,53,0.15)" },
  catIcon:        { fontSize: 24, marginBottom: 4 },
  catLabel:       { fontSize: 10, color: "rgba(255,255,255,0.6)", textAlign: "center", fontWeight: "600" },
  catLabelActive: { color: "#FF6B35" },
  btn:            { backgroundColor: "#FF6B35", borderRadius: 14, paddingVertical: 16, alignItems: "center", margin: 20 },
  btnCreate:      { marginTop: 0 },
  btnDisabled:    { opacity: 0.4 },
  btnText:        { color: "#fff", fontWeight: "700", fontSize: 16 },
  coordsText:     { fontSize: 12, color: "#10B981", flex: 1 },
  mapContainer:   { flex: 1, marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  mapHint:        { fontSize: 12, color: "#aaa", textAlign: "center", marginVertical: 8, paddingHorizontal: 20 },
});