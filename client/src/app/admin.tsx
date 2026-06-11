import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed", confirmed: "ready", ready: "delivered",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; next: string }> = {
  pending:   { label: "En attente",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  next: "Confirmer" },
  confirmed: { label: "Confirmée",   color: "#3B82F6", bg: "rgba(59,130,246,0.15)",  next: "Prête" },
  ready:     { label: "Prête",       color: "#10B981", bg: "rgba(16,185,129,0.15)",  next: "Livrée" },
  delivered: { label: "Livrée",      color: "#6EE7B7", bg: "rgba(110,231,183,0.15)", next: "" },
  cancelled: { label: "Annulée",     color: "#EF4444", bg: "rgba(239,68,68,0.15)",   next: "" },
};

const TABS = ["pending", "confirmed", "ready", "delivered"];

interface OrderItem { name: string; price: number; quantity: number; }
interface Order {
  _id: string;
  client: { name: string; email: string } | null;
  items: OrderItem[];
  total: number;
  status: string;
  type: string;
  createdAt: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState("pending");
  const [updating, setUpdating]     = useState<string | null>(null);
  const [stats, setStats]           = useState({ total: 0, revenue: 0, today: 0 });

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { router.replace("/login"); return; }
      const res = await fetch(`${API_URL}/api/orders/business`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data: Order[] = await res.json();
      setOrders(data);
      const today = new Date().toDateString();
      setStats({
        total:   data.length,
        revenue: data.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total ?? 0), 0),
        today:   data.filter(o => new Date(o.createdAt).toDateString() === today).length,
      });
    } catch {
      Alert.alert("Erreur", "Impossible de charger les commandes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;
    setUpdating(orderId);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o));
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour");
    } finally {
      setUpdating(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    Alert.alert("Annuler", "Voulez-vous annuler cette commande ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui", style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("kaviroq_token");
          await fetch(`${API_URL}/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: "cancelled" }),
          });
          setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o));
        }
      }
    ]);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter(o => o.status === activeTab);
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Tableau de bord" subtitle="Gestion des commandes" />

      <View style={styles.statsRow}>
        {[
          { value: stats.today,                    label: "Aujourd'hui",    icon: "📅" },
          { value: stats.total,                    label: "Total",          icon: "📦" },
          { value: stats.revenue.toLocaleString(), label: "FCFA encaissés", icon: "💰" },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TABS.map(tab => {
            const count  = orders.filter(o => o.status === tab).length;
            const st     = STATUS_LABELS[tab];
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && { backgroundColor: st.color }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, active && { color: "#fff" }]}>{st.label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? "rgba(255,255,255,0.3)" : st.bg }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? "#fff" : st.color }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[theme.primary]} />}
        contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔭</Text>
            <Text style={styles.emptyText}>Aucune commande {STATUS_LABELS[activeTab]?.label.toLowerCase()}</Text>
          </View>
        ) : (
          filteredOrders.map(order => {
            const st = STATUS_LABELS[order.status];
            const isUpdating = updating === order._id;
            return (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>👤 {order.client?.name ?? "Client"}</Text>
                    <Text style={styles.orderTime}>
                      {order.type === "delivery" ? "🛵 Livraison" : "🏃 À emporter"} · {formatTime(order.createdAt)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st?.bg }]}>
                    <Text style={[styles.statusText, { color: st?.color }]}>{st?.label}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {order.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
                    <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <Text style={styles.totalText}>{order.total?.toLocaleString()} FCFA</Text>
                  <View style={styles.actions}>
                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelOrder(order._id)}>
                        <Text style={styles.cancelBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                    {st?.next && (
                      <TouchableOpacity
                        style={[styles.nextBtn, isUpdating && { opacity: 0.6 }]}
                        onPress={() => updateStatus(order._id, order.status)}
                        disabled={isUpdating}
                      >
                        {isUpdating
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.nextBtnText}>→ {st.next}</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.refText}>#{order._id.slice(-6).toUpperCase()}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: theme.dark },
  centered:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:   { color: "rgba(255,255,255,0.5)" },
  statsRow:      { flexDirection: "row", padding: 12, gap: 10 },
  statCard:      { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", gap: 4 },
  statIcon:      { fontSize: 20 },
  statValue:     { fontSize: 18, fontWeight: "800", color: theme.primary },
  statLabel:     { fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  tabsScroll:    { maxHeight: 52, paddingHorizontal: 12 },
  tabs:          { flexDirection: "row", gap: 8, paddingVertical: 6 },
  tab:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", flexDirection: "row", alignItems: "center", gap: 6 },
  tabText:       { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  tabBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText:  { fontSize: 11, fontWeight: "bold" },
  emptyBox:      { alignItems: "center", paddingTop: 50, gap: 10 },
  emptyEmoji:    { fontSize: 50 },
  emptyText:     { color: "rgba(255,255,255,0.4)", fontSize: 15 },
  orderCard:     { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardHeader:    { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  clientName:    { fontSize: 15, fontWeight: "bold", color: "#fff" },
  orderTime:     { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:    { fontSize: 12, fontWeight: "600" },
  divider:       { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 10 },
  itemRow:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  itemName:      { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  itemPrice:     { fontSize: 14, color: "#fff", fontWeight: "500" },
  cardFooter:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText:     { fontSize: 16, fontWeight: "bold", color: theme.primary },
  actions:       { flexDirection: "row", gap: 8 },
  cancelBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.2)", alignItems: "center", justifyContent: "center" },
  cancelBtnText: { color: "#FCA5A5", fontWeight: "bold" },
  nextBtn:       { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  nextBtnText:   { color: "#fff", fontWeight: "bold", fontSize: 13 },
  refText:       { fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, textAlign: "right" },
});
