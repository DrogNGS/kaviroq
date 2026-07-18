import { useAuth } from "../../store/AuthContext";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Image, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocket } from "../../services/socket";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

type OrderItem = { name: string; price: number; quantity: number };
type Order = {
  _id: string;
  client: { name: string; email: string };
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  type: "pickup" | "delivery";
  deliveryAddress?: string;
  createdAt: string;
};

type BusinessInfo = {
  _id: string;
  name: string;
  isOpen: boolean;
};

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: "#F59E0B", next: "confirmed" },
  confirmed: { label: "Confirmée",   color: "#3B82F6", next: "ready"     },
  ready:     { label: "Prête",       color: "#8B5CF6", next: "delivered" },
  delivered: { label: "Livrée",      color: "#10B981", next: null        },
  cancelled: { label: "Annulée",     color: "#EF4444", next: null        },
};

const NEXT_LABEL: Record<string, string> = {
  confirmed: "Confirmer",
  ready:     "Marquer prête",
  delivered: "Marquer livrée",
};

const FILTERS = ["Toutes", "pending", "confirmed", "ready", "delivered", "cancelled"] as const;

export default function BusinessDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("Toutes");
  const [updating, setUpdating] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const alertAnim = useRef(new Animated.Value(-100)).current;
  const router = useRouter();
  const { user, logout } = useAuth();

  const showAlert = useCallback((order: Order) => {
    setNewOrderAlert(order);
    Animated.sequence([
      Animated.spring(alertAnim, { toValue: 0, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(alertAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => setNewOrderAlert(null));
  }, [alertAnim]);

  const fetchOrders = useCallback(async () => {
  try {
    const token = await AsyncStorage.getItem("kaviroq_token");

    // Vérifier si l'entreprise existe
    const bizRes = await fetch(`${API_URL}/businesses/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bizData = await bizRes.json();

    // Si pas d'entreprise → rediriger vers setup
    if (!Array.isArray(bizData) || bizData.length === 0) {
      router.replace("/dashboard/setup");
      return;
    }

    setBusiness({ _id: bizData[0]._id, name: bizData[0].name, isOpen: !!bizData[0].isOpen });

    const res = await fetch(`${API_URL}/orders/business`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { router.replace("/login"); return; }
    const data = await res.json();
    setOrders(data);
  } catch {
    Alert.alert("Erreur", "Impossible de charger les commandes.");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => {
    fetchOrders();
    const socket = getSocket();
    socket.on("new_order", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      showAlert(order);
    });
    socket.on("order_status_updated", ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    });
    return () => {
      socket.off("new_order");
      socket.off("order_status_updated");
    };
  }, []);

  const toggleBusinessOpen = async () => {
    if (!business) return;
    const newValue = !business.isOpen;
    setTogglingOpen(true);
    // Optimistic update
    setBusiness((prev) => (prev ? { ...prev, isOpen: newValue } : prev));
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      const res = await fetch(`${API_URL}/businesses/${business._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOpen: newValue }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback si échec
      setBusiness((prev) => (prev ? { ...prev, isOpen: !newValue } : prev));
      Alert.alert("Erreur", "Impossible de mettre à jour le statut de l'entreprise.");
    } finally {
      setTogglingOpen(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o)));
      const socket = getSocket();
      socket.emit("update_status", { orderId, status: newStatus });
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "Toutes" ? orders : orders.filter((o) => o.status === filter);
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const renderOrder = ({ item }: { item: Order }) => {
    const cfg = STATUS_CONFIG[item.status];
    const nextStatus = cfg.next;
    const date = new Date(item.createdAt).toLocaleString("fr-FR", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.clientName}>{item.client?.name || "Client"}</Text>
            <Text style={styles.clientEmail}>{item.client?.email}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.color + "22", borderColor: cfg.color }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        {item.items.map((it, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemQty}>x{it.quantity}</Text>
            <Text style={styles.itemName}>{it.name}</Text>
            <Text style={styles.itemPrice}>{(it.price * it.quantity).toFixed(0)} FCFA</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.meta}>{date} · {item.type === "delivery" ? "Livraison" : "A emporter"}</Text>
            {item.deliveryAddress ? <Text style={styles.address}>{item.deliveryAddress}</Text> : null}
          </View>
          <Text style={styles.total}>{item.total?.toFixed(0)} FCFA</Text>
        </View>
        {nextStatus && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: STATUS_CONFIG[nextStatus as Order["status"]].color }]}
            onPress={() => updateStatus(item._id, nextStatus)}
            disabled={updating === item._id}
          >
            {updating === item._id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.actionBtnText}>{NEXT_LABEL[nextStatus]}</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Bannière nouvelle commande */}
      {newOrderAlert && (
        <Animated.View style={[styles.alertBanner, { transform: [{ translateY: alertAnim }] }]}>
          <Text style={styles.alertIcon}>🔔</Text>
          <View>
            <Text style={styles.alertTitle}>Nouvelle commande !</Text>
            <Text style={styles.alertSub}>{newOrderAlert.client?.name} · {newOrderAlert.total?.toFixed(0)} FCFA</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Commandes</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => router.push("/dashboard/menu")}>
              <Text style={styles.menuBtnText}>Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={async () => { await logout(); router.replace("/login"); }}
            >
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.welcomeText}>Bonjour, {user?.name} 👋</Text>

        {/* ✅ Toggle ouverture / fermeture de l'entreprise */}
        {business && (
          <TouchableOpacity
            style={[
              styles.openToggle,
              business.isOpen ? styles.openToggleOn : styles.openToggleOff,
            ]}
            onPress={toggleBusinessOpen}
            disabled={togglingOpen}
            activeOpacity={0.85}
          >
            <View style={styles.openToggleLeft}>
              <View style={[styles.openDot, { backgroundColor: business.isOpen ? "#10B981" : "#EF4444" }]} />
              <Text style={styles.openToggleLabel}>
                {business.isOpen ? "Boutique ouverte" : "Boutique fermée"}
              </Text>
            </View>
            {togglingOpen ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={[styles.switchTrack, business.isOpen && styles.switchTrackOn]}>
                <View style={[styles.switchThumb, business.isOpen && styles.switchThumbOn]} />
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: "#F59E0B" }]}>{counts.pending || 0}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: "#10B981" }]}>{counts.delivered || 0}</Text>
            <Text style={styles.statLabel}>Livrées</Text>
          </View>
        </View>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTERS.map((f) => {
          const cfg = f !== "Toutes" ? STATUS_CONFIG[f as Order["status"]] : null;
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, active && { backgroundColor: cfg?.color || "#111", borderColor: cfg?.color || "#111" }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, active && { color: "#fff" }]}>
                {cfg ? cfg.label : "Toutes"}{f !== "Toutes" && counts[f] ? ` (${counts[f]})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#111" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Aucune commande</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#F8F8F6" },
  alertBanner:     { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: "#111", flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, paddingTop: 50 },
  alertIcon:       { fontSize: 24 },
  alertTitle:      { color: "#fff", fontWeight: "800", fontSize: 15 },
  alertSub:        { color: "#aaa", fontSize: 12, marginTop: 2 },
  header:          { backgroundColor: "#111", paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  headerBtns:      { flexDirection: "row", gap: 8 },
  title:           { fontSize: 24, fontWeight: "800", color: "#fff" },
  welcomeText:     { color: "#aaa", fontSize: 13, marginBottom: 14 },

  // ✅ Toggle ouverture/fermeture
  openToggle:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1 },
  openToggleOn:    { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.35)" },
  openToggleOff:   { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.35)" },
  openToggleLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  openDot:         { width: 10, height: 10, borderRadius: 5 },
  openToggleLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
  switchTrack:     { width: 44, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.15)", padding: 3, justifyContent: "center" },
  switchTrackOn:   { backgroundColor: "rgba(16,185,129,0.4)" },
  switchThumb:     { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", alignSelf: "flex-start" },
  switchThumbOn:   { alignSelf: "flex-end" },

  menuBtn:         { backgroundColor: "#F59E0B", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  menuBtnText:     { color: "#fff", fontSize: 12, fontWeight: "700" },
  logoutBtn:       { backgroundColor: "rgba(239,68,68,0.2)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" },
  logoutText:      { color: "#EF4444", fontSize: 12, fontWeight: "700" },
  statsRow:        { flexDirection: "row", gap: 24 },
  stat:            { alignItems: "center" },
  statNum:         { fontSize: 22, fontWeight: "800", color: "#fff" },
  statLabel:       { fontSize: 11, color: "#aaa", marginTop: 2 },
  filterScroll:    { maxHeight: 52, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: "#ddd", backgroundColor: "#fff" },
  filterText:      { fontSize: 12, fontWeight: "600", color: "#555" },
  list:            { padding: 16, gap: 12 },
  card:            { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  clientName:      { fontSize: 15, fontWeight: "700", color: "#111" },
  clientEmail:     { fontSize: 12, color: "#999", marginTop: 2 },
  badge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5 },
  badgeText:       { fontSize: 11, fontWeight: "700" },
  divider:         { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  itemRow:         { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  itemQty:         { fontSize: 13, fontWeight: "700", color: "#888", width: 30 },
  itemName:        { flex: 1, fontSize: 13, color: "#333" },
  itemPrice:       { fontSize: 13, fontWeight: "600", color: "#111" },
  cardFooter:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  meta:            { fontSize: 11, color: "#999" },
  address:         { fontSize: 11, color: "#777", marginTop: 2 },
  total:           { fontSize: 17, fontWeight: "800", color: "#111" },
  actionBtn:       { marginTop: 14, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  actionBtnText:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty:           { alignItems: "center", marginTop: 80 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyText:       { fontSize: 16, color: "#aaa", fontWeight: "500" },
});
