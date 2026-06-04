import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiClient } from "../services/apiClient";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
}

interface Business {
  _id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  isOpen: boolean;
  menu: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "🍔", patisserie: "🎂", hotel: "🏨",
  maquis: "🍖", fast_food: "🍟", cafe: "☕",
};

export default function BusinessScreen() {
  const router = useRouter();
  const { businessId, businessName, category } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
    category: string;
  }>();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [cart, setCart]         = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        if (!businessId) { setError("Identifiant manquant"); setLoading(false); return; }
        const data = await apiClient.get<Business>(`/businesses/${businessId}`, false);
        setBusiness(data);
      } catch {
        setError("Impossible de charger le restaurant");
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [businessId]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(c => c._id === item._id);
      if (exists) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(c => c._id === item._id);
      if (!exists) return prev;
      if (exists.quantity === 1) return prev.filter(c => c._id !== item._id);
      return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const getQuantity   = (id: string) => cart.find(c => c._id === id)?.quantity ?? 0;
  const getTotal      = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrder = () => {
    router.push({
      pathname: "/order",
      params: {
        businessId:   business?._id ?? businessId ?? "",
        businessName: business?.name ?? businessName ?? "",
        cart:         JSON.stringify(cart),
        total:        getTotal().toString(),
      }
    });
  };

  const handleChat = () => {
    router.push({
      pathname: "/chat",
      params: {
        businessName: business?.name ?? businessName ?? "",
        roomId:       `business_${business?._id ?? businessId ?? "unknown"}`
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Chargement du menu...</Text>
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

  const name     = business?.name     ?? businessName ?? "Restaurant";
  const cat      = business?.category ?? category     ?? "";
  const menuList = business?.menu     ?? [];

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.businessName}>{name}</Text>
          <Text style={styles.businessCategory}>{cat}</Text>
        </View>
        <Text style={styles.headerEmoji}>{CATEGORY_ICONS[cat] ?? "🏪"}</Text>
      </View>

      {/* Infos */}
      <View style={styles.infoRow}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={[styles.badge, { backgroundColor: business?.isOpen ? "#E6F9F0" : "#FCF0F0" }]}>
            <Text style={{ color: business?.isOpen ? "#1D9E75" : "#E24B4A", fontWeight: "600", fontSize: 13 }}>
              {business?.isOpen ? "✅ Ouvert" : "❌ Fermé"}
            </Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <Text style={styles.chatBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>
        {business?.address && (
          <Text style={styles.address}>📍 {business.address}</Text>
        )}
        {business?.description && (
          <Text style={styles.description} numberOfLines={2}>{business.description}</Text>
        )}
      </View>

      {/* Menu */}
      <Text style={styles.menuTitle}>
        Menu {menuList.length === 0 ? "— aucun plat disponible" : `(${menuList.length} plats)`}
      </Text>

      <ScrollView style={styles.menuList} contentContainerStyle={{ paddingBottom: 100 }}>
        {menuList.length === 0 ? (
          <View style={styles.emptyMenu}>
            <Text style={styles.emptyText}>Ce restaurant n'a pas encore de menu en ligne</Text>
          </View>
        ) : (
          menuList
            .filter(item => item.available)
            .map((item) => {
              const qty = getQuantity(item._id);
              return (
                <View key={item._id} style={styles.menuItem}>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    )}
                    <Text style={styles.menuPrice}>{item.price.toLocaleString()} FCFA</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    {qty > 0 && (
                      <>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                      </>
                    )}
                    <TouchableOpacity
                      style={[styles.qtyBtn, styles.qtyBtnAdd]}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={[styles.qtyBtnText, { color: "#fff" }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
        )}
      </ScrollView>

      {/* Boutons bas */}
      <View style={styles.bottomButtons}>
        {cart.length > 0 && (
          <TouchableOpacity style={styles.cartButton} onPress={handleOrder}>
            <Text style={styles.cartButtonText}>
              🛒 {getTotalItems()} article{getTotalItems() > 1 ? "s" : ""} — {getTotal().toLocaleString()} FCFA → Commander
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f5f5f5" },
  centered:         { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText:      { marginTop: 12, color: "#666" },
  errorText:        { color: "#E24B4A", marginBottom: 12, textAlign: "center" },
  retryBtn:         { backgroundColor: "#FF6B35", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText:        { color: "#fff", fontWeight: "600" },
  header:           { backgroundColor: "#FF6B35", padding: 15, paddingTop: 50, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:          { padding: 4 },
  backText:         { color: "#fff", fontSize: 22 },
  businessName:     { fontSize: 18, fontWeight: "bold", color: "#fff" },
  businessCategory: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerEmoji:      { fontSize: 32 },
  infoRow:          { backgroundColor: "#fff", padding: 15, gap: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  badge:            { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chatBtn:          { backgroundColor: "#333", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chatBtnText:      { color: "#fff", fontWeight: "600", fontSize: 13 },
  address:          { fontSize: 13, color: "#666" },
  description:      { fontSize: 13, color: "#999", lineHeight: 18 },
  menuTitle:        { fontSize: 18, fontWeight: "bold", color: "#333", margin: 15, marginBottom: 5 },
  menuList:         { flex: 1 },
  emptyMenu:        { alignItems: "center", padding: 40 },
  emptyText:        { color: "#999", textAlign: "center" },
  menuItem:         { backgroundColor: "#fff", margin: 8, marginHorizontal: 15, padding: 15, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 10, elevation: 2 },
  menuInfo:         { flex: 1 },
  menuName:         { fontSize: 16, fontWeight: "bold", color: "#333" },
  menuDescription:  { fontSize: 12, color: "#999", marginTop: 3 },
  menuPrice:        { fontSize: 14, color: "#FF6B35", fontWeight: "bold", marginTop: 5 },
  qtyControls:      { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn:           { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#FF6B35", alignItems: "center", justifyContent: "center" },
  qtyBtnAdd:        { backgroundColor: "#FF6B35", borderColor: "#FF6B35" },
  qtyBtnText:       { fontSize: 18, color: "#FF6B35", fontWeight: "bold" },
  qtyText:          { fontSize: 16, fontWeight: "bold", color: "#333", minWidth: 20, textAlign: "center" },
  bottomButtons:    { position: "absolute", bottom: 0, left: 0, right: 0 },
  cartButton:       { backgroundColor: "#FF6B35", margin: 15, padding: 18, borderRadius: 10, alignItems: "center" },
  cartButtonText:   { color: "#fff", fontSize: 15, fontWeight: "bold" },
});