import React, { useRef, useState, useEffect } from "react";
import { theme } from "../theme";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ScrollView, ActivityIndicator, RefreshControl, Platform, TextInput
} from "react-native";
import { useRouter } from "expo-router";
import Navigation from "../components/Navigation";
import { useRestaurants, Business } from "../hooks/useRestaurants";
import { getSocket } from "../services/socket";

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "🍔", patisserie: "🎂", hotel: "🏨",
  maquis: "🏖", fast_food: "🍟", cafe: "☕",
  Salon: "💇", Commerce: "🛒", Service: "⚡",
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "#FF6B35", patisserie: "#E91E8C", hotel: "#2196F3",
  maquis: "#FF5722", fast_food: "#FF9800", cafe: "#795548",
  Salon: "#9C27B0", Commerce: "#4CAF50", Service: "#FF9800",
};

const categories = [
  { icon: "🍔", name: "Restaurants", value: "restaurant", color: "#FF6B35", bg: "#FFF0EB" },
  { icon: "🎂", name: "Pâtisseries", value: "patisserie", color: "#E91E8C", bg: "#FCE4F3" },
  { icon: "🏨", name: "Hôtels",      value: "hotel",      color: "#2196F3", bg: "#E3F2FD" },
  { icon: "💇", name: "Salons",      value: "maquis",     color: "#9C27B0", bg: "#F3E5F5" },
  { icon: "🛒", name: "Commerces",   value: "fast_food",  color: "#4CAF50", bg: "#E8F5E9" },
  { icon: "⚡", name: "Services",    value: "cafe",       color: "#FF9800", bg: "#FFF3E0" },
];

const CategoryCard = ({ cat, isSelected, onPress }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }], width: "30%" }}>
      <TouchableOpacity
        style={[
          styles.categoryCard,
          isSelected && { backgroundColor: cat.color, borderColor: cat.color },
          !isSelected && { borderColor: cat.color + "40" }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIconBg, { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : cat.bg }]}>
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
        </View>
        <Text style={[styles.categoryName, isSelected && { color: "#fff" }]}>{cat.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const BusinessCard = ({ business, onPress, isOpenOverride }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const color = CATEGORY_COLORS[business.category] ?? "#FF6B35";
  const isOpen = isOpenOverride !== undefined ? isOpenOverride : business.isOpen;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={styles.businessCard} onPress={handlePress} activeOpacity={0.9}>
        <View style={[styles.businessIconBg, { backgroundColor: color + "20" }]}>
          <Text style={styles.businessEmoji}>{CATEGORY_ICONS[business.category] ?? "🏪"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.businessNameRow}>
            <Text style={styles.businessName}>{business.name}</Text>
            {/* Badge ouvert/fermé en temps réel */}
            <View style={[styles.statusBadge, { backgroundColor: isOpen ? "#10B98122" : "#EF444422" }]}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? "#10B981" : "#EF4444" }]} />
              <Text style={[styles.statusText, { color: isOpen ? "#10B981" : "#EF4444" }]}>
                {isOpen ? "Ouvert" : "Fermé"}
              </Text>
            </View>
          </View>
          <View style={styles.businessMeta}>
            <View style={[styles.categoryPill, { backgroundColor: color + "20" }]}>
              <Text style={[styles.categoryPillText, { color }]}>{business.category}</Text>
            </View>
            {business.address && (
              <Text style={styles.businessAddress} numberOfLines={1}>📍 {business.address}</Text>
            )}
          </View>
          {business.description && (
            <Text style={styles.businessDesc} numberOfLines={1}>{business.description}</Text>
          )}
        </View>
        <Text style={styles.businessArrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [openStatus, setOpenStatus] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ name: string; isOpen: boolean } | null>(null);
  const notifAnim = useRef(new Animated.Value(-80)).current;
  const { restaurants, isLoading, error, refresh, setFilters } = useRestaurants();

  // Socket.io — écouter les changements de statut en temps réel
  useEffect(() => {
    const socket = getSocket();

    socket.on("business_status_changed", ({ businessId, isOpen, name }: { businessId: string; isOpen: boolean; name: string }) => {
      // Mettre à jour le statut localement
      setOpenStatus((prev) => ({ ...prev, [businessId]: isOpen }));

      // Afficher une notification
      setNotification({ name, isOpen });
      Animated.sequence([
        Animated.spring(notifAnim, { toValue: 0, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(notifAnim, { toValue: -80, duration: 300, useNativeDriver: true }),
      ]).start(() => setNotification(null));
    });

    return () => {
      socket.off("business_status_changed");
    };
  }, []);

  const handleCategoryPress = (value: string) => {
    const next = selectedCategory === value ? null : value;
    setSelectedCategory(next);
    setFilters({ category: next as any });
  };

  const filteredRestaurants = restaurants.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (id: string, name: string, category: string) => {
    router.push({ pathname: "/business/[id]", params: { id } });
  };

  const buildMapHtml = (points: Business[]) => {
    const mapPoints = points.map(p => ({
      id: p._id,
      name: p.name,
      cat: p.category,
      lat: p.location?.coordinates?.[1] ?? 5.345317,
      lng: p.location?.coordinates?.[0] ?? -4.024429,
      isOpen: openStatus[p._id] !== undefined ? openStatus[p._id] : p.isOpen,
    }));

    return `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body{margin:0;padding:0}#map{height:100vh;width:100vw}.pb{background:#FF6B35;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:bold}</style>
    </head><body>
      <div id="map"></div>
      <script>
        var map=L.map('map').setView([5.345317,-4.024429],13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        var icons={'restaurant':'🍔','patisserie':'🎂','hotel':'🏨','maquis':'🏖','fast_food':'🍟','cafe':'☕'};
        var pts=${JSON.stringify(mapPoints)};
        pts.forEach(function(p,i){
          var emoji=icons[p.cat]||'🏪';
          var borderColor=p.isOpen?'#10B981':'#EF4444';
          var icon=L.divIcon({
            html:'<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));border:3px solid '+borderColor+';border-radius:50%;background:white;padding:2px">'+emoji+'</div>',
            iconSize:[40,40],iconAnchor:[20,40],popupAnchor:[0,-40],className:''
          });
          var statusLabel=p.isOpen?'<span style="color:#10B981;font-weight:bold">Ouvert</span>':'<span style="color:#EF4444;font-weight:bold">Fermé</span>';
          L.marker([p.lat,p.lng],{icon:icon}).addTo(map)
           .bindPopup('<b>'+p.name+'</b><br>'+p.cat+' · '+statusLabel+'<br><br><button class="pb" onclick="go('+i+')">Voir le menu</button>');
        });
        function go(i){
          var p=pts[i];
          var m={type:'openBusiness',id:p.id,name:p.name,category:p.cat};
          if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));
          else window.parent.postMessage(m,'*');
        }
      </script>
    </body></html>`;
  };

  const MapComponent = () => {
    const html = buildMapHtml(restaurants);
    if (Platform.OS === "web") {
      return (
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "100%", border: "none" } as any}
          onLoad={() => {
            window.addEventListener("message", (event) => {
              if (event.data?.type === "openBusiness") {
                handleOpen(event.data.id, event.data.name, event.data.category);
              }
            });
          }}
        />
      );
    }
    const { WebView } = require("react-native-webview");
    return (
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "openBusiness") handleOpen(data.id, data.name, data.category);
          } catch {}
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.dark }}>
      {/* Notification temps réel */}
      {notification && (
        <Animated.View style={[styles.notifBanner, { transform: [{ translateY: notifAnim }] }]}>
          <View style={[styles.notifDot, { backgroundColor: notification.isOpen ? "#10B981" : "#EF4444" }]} />
          <Text style={styles.notifText}>
            <Text style={{ fontWeight: "800" }}>{notification.name}</Text>
            {notification.isOpen ? " vient d'ouvrir 🎉" : " est maintenant fermé"}
          </Text>
        </Animated.View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} colors={["#FF6B35"]} />}
        contentContainerStyle={{ paddingBottom: 300 }}
        style={styles.container}
      >
        <Navigation cartCount={0} />

        <View style={styles.mapContainer}>
          <MapComponent />
        </View>

        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant, plat..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => { setSelectedCategory(null); setFilters({}); }}>
              <Text style={styles.clearFilter}>Tout voir</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.categoriesGrid}>
          {categories.map((cat, index) => (
            <CategoryCard
              key={index}
              cat={cat}
              isSelected={selectedCategory === cat.value}
              onPress={() => handleCategoryPress(cat.value)}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `"${searchQuery}"` : selectedCategory ?? "Près de vous"}
          </Text>
          <Text style={styles.sectionCount}>{filteredRestaurants.length} résultats</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRestaurants.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Aucun restaurant trouvé"}
            </Text>
          </View>
        ) : (
          filteredRestaurants.map((b) => (
            <BusinessCard
              key={b._id}
              business={b}
              isOpenOverride={openStatus[b._id]}
              onPress={() => handleOpen(b._id, b.name, b.category)}
            />
          ))
        )}

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#1a1a2e" }]}
              onPress={() => router.push({ pathname: "/chat", params: { businessName: "Support", roomId: "room_1" } })}
            >
              <Text style={styles.actionEmoji}>💬</Text>
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#FF6B35" }]}
              onPress={() => router.push("/history")}
            >
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionText}>Commandes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#2196F3" }]}
              onPress={() => router.push("/admin")}
            >
              <Text style={styles.actionEmoji}>⚙️</Text>
              <Text style={styles.actionText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: theme.dark },
  notifBanner:      { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: "#1a1a2e", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12, paddingTop: 50 },
  notifDot:         { width: 10, height: 10, borderRadius: 5 },
  notifText:        { color: "#fff", fontSize: 13, flex: 1 },
  mapContainer:     { height: 280, width: "100%", overflow: "hidden" },
  searchBar:        { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 14, marginBottom: 4, padding: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, borderWidth: 1.5, borderColor: "#f0f0f0" },
  searchBarFocused: { borderColor: "#FF6B35", shadowOpacity: 0.15 },
  searchIcon:       { fontSize: 16, marginRight: 8 },
  searchInput:      { flex: 1, fontSize: 15, color: "#333", padding: 0 },
  clearBtn:         { padding: 4 },
  clearText:        { color: "#bbb", fontSize: 16 },
  sectionHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 15, marginTop: 18, marginBottom: 10 },
  sectionTitle:     { fontSize: 18, fontWeight: "700", color: "#fff" },
  sectionCount:     { fontSize: 13, color: "#999" },
  clearFilter:      { fontSize: 13, color: "#FF6B35", fontWeight: "600" },
  categoriesGrid:   { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, gap: 10, marginBottom: 6 },
  categoryCard:     { backgroundColor: "#fff", padding: 14, borderRadius: 14, alignItems: "center", borderWidth: 1.5, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  categoryIconBg:   { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  categoryIcon:     { fontSize: 26 },
  categoryName:     { fontSize: 11, color: "#555", textAlign: "center", fontWeight: "600" },
  businessCard:     { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 10, padding: 14, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  businessIconBg:   { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  businessEmoji:    { fontSize: 28 },
  businessNameRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  businessName:     { fontSize: 15, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  statusBadge:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusText:       { fontSize: 11, fontWeight: "700" },
  businessMeta:     { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryPill:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  categoryPillText: { fontSize: 11, fontWeight: "600" },
  businessAddress:  { fontSize: 11, color: "#999", flex: 1 },
  businessDesc:     { fontSize: 12, color: "#bbb", marginTop: 4 },
  businessArrow:    { fontSize: 24, fontWeight: "300", color: "#ccc" },
  loadingBox:       { alignItems: "center", padding: 30, gap: 10 },
  loadingText:      { color: "#999", fontSize: 14 },
  errorBox:         { alignItems: "center", padding: 30, gap: 10 },
  errorEmoji:       { fontSize: 40 },
  errorText:        { color: "#E24B4A", textAlign: "center" },
  retryBtn:         { backgroundColor: "#FF6B35", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText:        { color: "#fff", fontWeight: "600" },
  emptyBox:         { alignItems: "center", padding: 30, gap: 10 },
  emptyEmoji:       { fontSize: 40 },
  emptyText:        { color: "#999", fontSize: 15 },
  actionSection:    { marginHorizontal: 15, marginTop: 20, marginBottom: 10 },
  actionGrid:       { flexDirection: "row", gap: 10, marginTop: 10 },
  actionBtn:        { flex: 1, padding: 16, borderRadius: 14, alignItems: "center", gap: 6 },
  actionEmoji:      { fontSize: 24 },
  actionText:       { color: "#fff", fontWeight: "700", fontSize: 13 },
});
