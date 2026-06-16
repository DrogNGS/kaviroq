import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: "En attente",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  icon: "⏳" },
  confirmed: { label: "Confirmée",   color: "#3B82F6", bg: "rgba(59,130,246,0.15)",  icon: "✅" },
  ready:     { label: "Prête",       color: "#10B981", bg: "rgba(16,185,129,0.15)",  icon: "🍽️" },
  delivered: { label: "Livrée",      color: "#6EE7B7", bg: "rgba(110,231,183,0.15)", icon: "🎉" },
  cancelled: { label: "Annulée",     color: "#EF4444", bg: "rgba(239,68,68,0.15)",   icon: "❌" },
};

// Filtres
const FILTERS = ["Toutes", "En attente", "Confirmée", "Prête", "Livrée", "Annulée"];
const FILTER_KEYS: Record<string, string | null> = {
  "Toutes": null, "En attente": "pending", "Confirmée": "confirmed",
  "Prête": "ready", "Livrée": "delivered", "Annulée": "cancelled"
};

interface OrderItem { name: string; price: number; quantity: number; }
interface Order {
  _id: string;
  business: { name: string } | null;
  items: OrderItem[];
  total: number;
  status: string;
  type: string;
  createdAt: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("Toutes");

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { router.replace("/login"); return; }
      const res = await fetch(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch {
      setError("Impossible de charger vos commandes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  // Stats rapides
  const totalDepense = orders
    .filter(o => o.status === "delivered")
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const nbLivrees = orders.filter(o => o.status === "delivered").length;
  const nbEnCours = orders.filter(o => ["pending", "confirmed", "ready"].includes(o.status)).length;

  // Filtrage
  const filterKey = FILTER_KEYS[activeFilter];
  const filteredOrders = filterKey ? orders.filter(o => o.status === filterKey) : orders;

  return (
    <View style={styles.container}>
      <AppHeader title="Mes commandes" subtitle={`${orders.length} commande${orders.length > 1 ? "s" : ""}`} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* ✅ Stats rapides */}
          {orders.length > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📦</Text>
                <Text style={styles.statValue}>{orders.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🔄</Text>
                <Text style={[styles.statValue, { color: "#F59E0B" }]}>{nbEnCours}</Text>
                <Text style={styles.statLabel}>En cours</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={[styles.statValue, { color: "#10B981" }]}>{nbLivrees}</Text>
                <Text style={styles.statLabel}>Livrées</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={[styles.statValue, { color: theme.primary, fontSize: 13 }]}>{totalDepense.toLocaleString()}</Text>
                <Text style={styles.statLabel}>FCFA</Text>
              </View>
            </View>
          )}

          {/* ✅ Filtres horizontaux */}
          {orders.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              <View style={styles.filters}>
                {FILTERS.map(f => {
                  const key = FILTER_KEYS[f];
                  const count = key ? orders.filter(o => o.status === key).length : orders.length;
                  const active = activeFilter === f;
                  const st = key ? STATUS_LABELS[key] : null;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterBtn, active && { backgroundColor: st?.color ?? theme.primary }]}
                      onPress={() => setActiveFilter(f)}
                    >
                      <Text style={[styles.filterText, active && { color: "#fff" }]}>{f}</Text>
                      {count > 0 && (
                        <View style={[styles.filterBadge, { backgroundColor: active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)" }]}>
                          <Text style={[styles.filterBadgeText, active && { color: "#fff" }]}>{count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View style={{ padding: 15 }}>
            {filteredOrders.length === 0 && orders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyTitle}>Aucune commande</Text>
                <Text style={styles.emptyText}>Vos commandes apparaîtront ici</Text>
                <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/home")}>
                  <Text style={styles.shopBtnText}>Parcourir les restaurants</Text>
                </TouchableOpacity>
              </View>
            ) : filteredOrders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Aucune commande {activeFilter.toLowerCase()}</Text>
                <TouchableOpacity onPress={() => setActiveFilter("Toutes")}>
                  <Text style={{ color: theme.primary, fontWeight: "600", marginTop: 8 }}>Voir toutes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredOrders.map((order) => {
                const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "#999", bg: "rgba(255,255,255,0.1)", icon: "📦" };
                return (
                  <View key={order._id} style={styles.orderCard}>

                    {/* ✅ Header avec icône statut */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.statusIconBox, { backgroundColor: st.bg }]}>
                        <Text style={styles.statusIconText}>{st.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.businessName}>🏪 {order.business?.name ?? "Restaurant"}</Text>
                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Articles */}
                    {order.items.map((item, i) => (
                      <View key={i} style={styles.itemRow}>
                        <View style={styles.itemQtyBox}>
                          <Text style={styles.itemQty}>{item.quantity}×</Text>
                        </View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
                      </View>
                    ))}

                    <View style={styles.divider} />

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.orderType}>
                        {order.type === "delivery" ? "🛵 Livraison" : "🏃 À emporter"}
                      </Text>
                      <Text style={styles.totalText}>{order.total?.toLocaleString()} FCFA</Text>
                    </View>

                    <Text style={styles.refText}>Réf : #{order._id.slice(-6).toUpperCase()}</Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.dark },
  centered:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:    { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  errorEmoji:     { fontSize: 40 },
  errorText:      { color: "#FCA5A5", textAlign: "center" },
  retryBtn:       { backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText:      { color: "#fff", fontWeight: "600" },

  // ✅ Stats
  statsRow:       { flexDirection: "row", paddingHorizontal: 15, paddingTop: 15, gap: 10 },
  statCard:       { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  statIcon:       { fontSize: 18 },
  statValue:      { fontSize: 16, fontWeight: "800", color: theme.primary },
  statLabel:      { fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" },

  // ✅ Filtres
  filtersScroll:  { maxHeight: 52, paddingHorizontal: 15, marginTop: 12 },
  filters:        { flexDirection: "row", gap: 8, paddingVertical: 6 },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", flexDirection: "row", alignItems: "center", gap: 6 },
  filterText:     { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  filterBadge:    { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  filterBadgeText:{ fontSize: 11, fontWeight: "bold", color: "rgba(255,255,255,0.6)" },

  // Vide
  emptyBox:       { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyEmoji:     { fontSize: 60 },
  emptyTitle:     { fontSize: 20, fontWeight: "bold", color: "#fff" },
  emptyText:      { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  shopBtn:        { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  shopBtnText:    { color: "#fff", fontWeight: "bold" },

  // ✅ Carte commande
  orderCard:      { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardHeader:     { flexDirection: "row", alignItems: "center", gap: 10 },
  statusIconBox:  { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statusIconText: { fontSize: 20 },
  businessName:   { fontSize: 15, fontWeight: "bold", color: "#fff" },
  orderDate:      { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  statusBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:     { fontSize: 12, fontWeight: "600" },
  divider:        { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 10 },
  itemRow:        { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  itemQtyBox:     { backgroundColor: "rgba(255,107,53,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemQty:        { fontSize: 12, color: theme.primary, fontWeight: "700" },
  itemName:       { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.7)" },
  itemPrice:      { fontSize: 14, color: "#fff", fontWeight: "500" },
  cardFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderType:      { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  totalText:      { fontSize: 15, fontWeight: "bold", color: theme.primary },
  refText:        { fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, textAlign: "right" },
});

