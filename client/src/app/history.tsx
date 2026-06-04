import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
  confirmed: { label: "ConfirmÃ©e",   color: "#3B82F6", bg: "rgba(59,130,246,0.15)"  },
  ready:     { label: "PrÃªte",       color: "#10B981", bg: "rgba(16,185,129,0.15)"  },
  delivered: { label: "LivrÃ©e",      color: "#6EE7B7", bg: "rgba(110,231,183,0.15)" },
  cancelled: { label: "AnnulÃ©e",     color: "#EF4444", bg: "rgba(239,68,68,0.15)"   },
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
          <Text style={styles.errorEmoji}>ðŸ˜•</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>RÃ©essayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>ðŸ›’</Text>
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptyText}>Vos commandes apparaÃ®tront ici</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/home")}>
                <Text style={styles.shopBtnText}>Parcourir les restaurants</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => {
              const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "#999", bg: "rgba(255,255,255,0.1)" };
              return (
                <View key={order._id} style={styles.orderCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.businessName}>ðŸª {order.business?.name ?? "Restaurant"}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {order.items.map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.quantity}Ã— {item.name}</Text>
                      <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  <View style={styles.cardFooter}>
                    <Text style={styles.orderType}>
                      {order.type === "delivery" ? "ðŸ›µ Livraison" : "ðŸƒ Ã€ emporter"}
                    </Text>
                    <Text style={styles.totalText}>{order.total?.toLocaleString()} FCFA</Text>
                  </View>

                  <Text style={styles.refText}>RÃ©f : #{order._id.slice(-6).toUpperCase()}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.dark },
  centered:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:  { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  errorEmoji:   { fontSize: 40 },
  errorText:    { color: "#FCA5A5", textAlign: "center" },
  retryBtn:     { backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText:    { color: "#fff", fontWeight: "600" },
  emptyBox:     { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyEmoji:   { fontSize: 60 },
  emptyTitle:   { fontSize: 20, fontWeight: "bold", color: "#fff" },
  emptyText:    { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  shopBtn:      { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 10 },
  shopBtnText:  { color: "#fff", fontWeight: "bold" },
  orderCard:    { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardHeader:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  businessName: { fontSize: 15, fontWeight: "bold", color: "#fff" },
  orderDate:    { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: "600" },
  divider:      { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 10 },
  itemRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  itemName:     { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  itemPrice:    { fontSize: 14, color: "#fff", fontWeight: "500" },
  cardFooter:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderType:    { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  totalText:    { fontSize: 15, fontWeight: "bold", color: theme.primary },
  refText:      { fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, textAlign: "right" },
});
