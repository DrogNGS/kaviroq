import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

const DELIVERY_FEE = 500;

export default function OrderScreen() {
  const router = useRouter();
  const { businessId, businessName, cart, total } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
    cart: string;
    total: string;
  }>();

  const cartItems = cart ? JSON.parse(cart) : [];
  const subTotal  = parseInt(total ?? "0");

  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [loading, setLoading]     = useState(false);
  const [ordered, setOrdered]     = useState(false);
  const [orderId, setOrderId]     = useState<string | null>(null);

  const grandTotal = subTotal + (orderType === "delivery" ? DELIVERY_FEE : 0);

  const handleOrder = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) {
        Alert.alert("Erreur", "Vous devez Ãªtre connectÃ© pour commander");
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          business: businessId,
          items: cartItems.map((item: any) => ({
            name:     item.name,
            price:    item.price,
            quantity: item.quantity,
          })),
          orderType,
          total:       grandTotal,
          deliveryFee: orderType === "delivery" ? DELIVERY_FEE : 0,
          status:      "pending",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Erreur serveur");
      }

      const data = await res.json();
      setOrderId(data._id);
      setOrdered(true);

    } catch (err: any) {
      Alert.alert("Erreur", err.message ?? "Impossible de passer la commande");
    } finally {
      setLoading(false);
    }
  };

  // Ã‰cran succÃ¨s
  if (ordered) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>ðŸŽ‰</Text>
        <Text style={styles.successTitle}>Commande envoyÃ©e !</Text>
        <Text style={styles.successText}>
          Votre commande a Ã©tÃ© transmise Ã  {businessName ?? "le restaurant"}.
          Vous recevrez une confirmation bientÃ´t.
        </Text>
        {orderId && (
          <Text style={styles.orderIdText}>
            RÃ©f : #{orderId.slice(-6).toUpperCase()}
          </Text>
        )}
        <TouchableOpacity
          style={styles.successButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.successButtonText}>Retour Ã  l'accueil</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>Ma commande</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Nom du restaurant */}
        <Text style={styles.restaurantName}>
          ðŸª {businessName ?? "Restaurant"}
        </Text>

        {/* Articles */}
        <Text style={styles.sectionTitle}>Articles</Text>
        {cartItems.map((item: any, index: number) => (
          <View key={index} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price.toLocaleString()} FCFA Ã— {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>
              {(item.price * item.quantity).toLocaleString()} FCFA
            </Text>
          </View>
        ))}

        {/* Type de commande */}
        <Text style={styles.sectionTitle}>Mode de rÃ©cupÃ©ration</Text>
        <View style={styles.orderTypeContainer}>
          <TouchableOpacity
            style={[styles.orderTypeButton, orderType === "pickup" && styles.orderTypeActive]}
            onPress={() => setOrderType("pickup")}
          >
            <Text style={styles.orderTypeEmoji}>ðŸƒ</Text>
            <Text style={[styles.orderTypeText, orderType === "pickup" && styles.orderTypeTextActive]}>
              Ã€ emporter
            </Text>
            <Text style={styles.orderTypeSub}>Gratuit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.orderTypeButton, orderType === "delivery" && styles.orderTypeActive]}
            onPress={() => setOrderType("delivery")}
          >
            <Text style={styles.orderTypeEmoji}>ðŸ›µ</Text>
            <Text style={[styles.orderTypeText, orderType === "delivery" && styles.orderTypeTextActive]}>
              Livraison
            </Text>
            <Text style={styles.orderTypeSub}>+{DELIVERY_FEE} FCFA</Text>
          </TouchableOpacity>
        </View>

        {/* RÃ©sumÃ© */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>RÃ©sumÃ©</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subTotal.toLocaleString()} FCFA</Text>
          </View>
          {orderType === "delivery" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de livraison</Text>
              <Text style={styles.summaryValue}>{DELIVERY_FEE} FCFA</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{grandTotal.toLocaleString()} FCFA</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bouton confirmer */}
      <TouchableOpacity
        style={[styles.orderButton, loading && { opacity: 0.7 }]}
        onPress={handleOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.orderButtonText}>
            âœ… Confirmer â€” {grandTotal.toLocaleString()} FCFA
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f5f5f5" },
  header:             { backgroundColor: "#FF6B35", padding: 15, paddingTop: 50, flexDirection: "row", alignItems: "center", gap: 15 },
  backBtn:            { padding: 4 },
  backText:           { color: "#fff", fontSize: 22 },
  title:              { color: "#fff", fontSize: 20, fontWeight: "bold" },
  content:            { flex: 1, padding: 15 },
  restaurantName:     { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 15, backgroundColor: "#fff", padding: 12, borderRadius: 10, elevation: 2 },
  sectionTitle:       { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10, marginTop: 15 },
  cartItem:           { backgroundColor: "#fff", padding: 15, borderRadius: 10, flexDirection: "row", alignItems: "center", marginBottom: 8, elevation: 2 },
  itemInfo:           { flex: 1 },
  itemName:           { fontSize: 15, fontWeight: "bold", color: "#333" },
  itemPrice:          { fontSize: 13, color: "#999", marginTop: 3 },
  itemTotal:          { fontSize: 15, color: "#FF6B35", fontWeight: "bold" },
  orderTypeContainer: { flexDirection: "row", gap: 15, marginBottom: 10 },
  orderTypeButton:    { flex: 1, backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center", borderWidth: 2, borderColor: "#eee", elevation: 2 },
  orderTypeActive:    { borderColor: "#FF6B35", backgroundColor: "#fff5f0" },
  orderTypeEmoji:     { fontSize: 30, marginBottom: 5 },
  orderTypeText:      { fontSize: 14, color: "#666", fontWeight: "bold" },
  orderTypeTextActive: { color: "#FF6B35" },
  orderTypeSub:       { fontSize: 12, color: "#999", marginTop: 3 },
  summary:            { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginTop: 10, elevation: 2 },
  summaryTitle:       { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  summaryRow:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel:       { fontSize: 14, color: "#666" },
  summaryValue:       { fontSize: 14, color: "#333" },
  totalRow:           { borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10, marginTop: 5 },
  totalLabel:         { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalValue:         { fontSize: 16, fontWeight: "bold", color: "#FF6B35" },
  orderButton:        { backgroundColor: "#FF6B35", margin: 15, padding: 18, borderRadius: 10, alignItems: "center", position: "absolute", bottom: 0, left: 0, right: 0 },
  orderButtonText:    { color: "#fff", fontSize: 15, fontWeight: "bold" },
  successContainer:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#fff" },
  successEmoji:       { fontSize: 80, marginBottom: 20 },
  successTitle:       { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 15 },
  successText:        { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 15, lineHeight: 24 },
  orderIdText:        { fontSize: 14, color: "#FF6B35", fontWeight: "bold", marginBottom: 20, backgroundColor: "#fff5f0", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  successButton:      { backgroundColor: "#FF6B35", padding: 18, borderRadius: 10, width: "100%", alignItems: "center" },
  successButtonText:  { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

