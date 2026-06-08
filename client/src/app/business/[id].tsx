import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

type MenuItem = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  available: boolean;
};

type Business = {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  isOpen: boolean;
  menu: MenuItem[];
};

type CartItem = MenuItem & { quantity: number };

export default function BusinessMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const fetchBusiness = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/businesses/${id}`);
      const data = await res.json();
      setBusiness(data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger le menu.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBusiness(); }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) {
        return prev.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) => c._id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter((c) => c._id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Ouvrir le chat avec cette entreprise
  const openChat = async () => {
    const userJson = await AsyncStorage.getItem("kaviroq_user");
    if (!userJson) { router.replace("/login"); return; }
    const user = JSON.parse(userJson);
    const clientId = user.id || user._id;
    const roomId = `${clientId}_${id}`;

    router.push({
      pathname: "/chat",
      params: {
        roomId,
        businessName: business?.name || "Entreprise",
      }
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) { Alert.alert("Panier vide", "Ajoutez des articles avant de commander."); return; }
    if (orderType === "delivery" && !address.trim()) { Alert.alert("Adresse requise", "Entrez votre adresse de livraison."); return; }

    setPlacing(true);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { router.replace("/login"); return; }

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          business: id,
          items: cart.map((c) => ({ name: c.name, price: c.price, quantity: c.quantity })),
          total: cartTotal,
          type: orderType,
          deliveryAddress: orderType === "delivery" ? address : undefined,
        }),
      });

      if (!res.ok) throw new Error();
      setCart([]);
      setShowCart(false);
      Alert.alert("✅ Commande envoyée !", "Votre commande a été transmise au restaurant.");
    } catch {
      Alert.alert("Erreur", "Impossible de passer la commande.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#111" />;
  if (!business) return <View style={styles.container}><Text style={styles.errorText}>Restaurant introuvable</Text></View>;

  const availableMenu = business.menu.filter((item) => item.available);

  if (showCart) {
    return (
      <View style={styles.container}>
        <View style={styles.cartHeader}>
          <TouchableOpacity onPress={() => setShowCart(false)}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.cartTitle}>Mon panier</Text>
          <Text style={styles.cartCount}>{cartCount} article{cartCount > 1 ? "s" : ""}</Text>
        </View>

        <ScrollView style={styles.cartList}>
          {cart.map((item) => (
            <View key={item._id} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{(item.price * item.quantity).toFixed(0)} FCFA</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item._id)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.orderTypeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, orderType === "pickup" && styles.typeBtnActive]}
              onPress={() => setOrderType("pickup")}
            >
              <Text style={[styles.typeBtnText, orderType === "pickup" && styles.typeBtnTextActive]}>🏃 À emporter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, orderType === "delivery" && styles.typeBtnActive]}
              onPress={() => setOrderType("delivery")}
            >
              <Text style={[styles.typeBtnText, orderType === "delivery" && styles.typeBtnTextActive]}>🚚 Livraison</Text>
            </TouchableOpacity>
          </View>

          {orderType === "delivery" && (
            <View style={styles.addressBox}>
              <Text style={styles.addressLabel}>Adresse de livraison</Text>
              <TextInput
                style={styles.addressInput}
                placeholder="Votre adresse complète"
                placeholderTextColor="#aaa"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.cartFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{cartTotal.toFixed(0)} FCFA</Text>
          </View>
          <TouchableOpacity style={[styles.orderBtn, placing && { opacity: 0.7 }]} onPress={placeOrder} disabled={placing}>
            {placing ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderBtnText}>Commander →</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header restaurant */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.businessName}>{business.name}</Text>
          {business.category && <Text style={styles.businessCategory}>{business.category}</Text>}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: business.isOpen ? "#10B981" : "#EF4444" }]} />
            <Text style={styles.statusText}>{business.isOpen ? "Ouvert" : "Fermé"}</Text>
          </View>
        </View>

        {/* ✅ Boutons chat + panier */}
        <View style={{ gap: 8, alignItems: "flex-end" }}>
          <TouchableOpacity style={styles.chatBadge} onPress={openChat}>
            <Text style={styles.chatBadgeText}>💬 Contacter</Text>
          </TouchableOpacity>
          {cartCount > 0 && (
            <TouchableOpacity style={styles.cartBadge} onPress={() => setShowCart(true)}>
              <Text style={styles.cartBadgeText}>🛒 {cartCount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {business.description && (
        <Text style={styles.description}>{business.description}</Text>
      )}

      {/* Menu */}
      <FlatList
        data={availableMenu}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.menuList}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Menu ({availableMenu.length} plats)</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>Aucun plat disponible</Text>
          </View>
        }
        renderItem={({ item }) => {
          const inCart = cart.find((c) => c._id === item._id);
          return (
            <View style={styles.menuCard}>
              <View style={styles.menuCardInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && <Text style={styles.menuItemDesc}>{item.description}</Text>}
                <Text style={styles.menuItemPrice}>{item.price.toFixed(0)} FCFA</Text>
              </View>
              <View style={styles.menuCardAction}>
                {inCart ? (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item._id)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{inCart.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)} disabled={!business.isOpen}>
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Bouton panier flottant */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => setShowCart(true)}>
          <Text style={styles.floatingCartText}>🛒 Voir le panier ({cartCount}) · {cartTotal.toFixed(0)} FCFA</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#F8F8F6" },
  errorText:          { textAlign: "center", marginTop: 100, color: "#999" },
  header:             { backgroundColor: "#111", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  backBtn:            { color: "#fff", fontSize: 22, fontWeight: "600", marginTop: 2 },
  headerInfo:         { flex: 1 },
  businessName:       { fontSize: 22, fontWeight: "800", color: "#fff" },
  businessCategory:   { fontSize: 13, color: "#aaa", marginTop: 2 },
  statusRow:          { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  statusDot:          { width: 8, height: 8, borderRadius: 4 },
  statusText:         { fontSize: 12, color: "#aaa" },
  chatBadge:          { backgroundColor: "#FF6B35", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chatBadgeText:      { color: "#fff", fontWeight: "700", fontSize: 13 },
  cartBadge:          { backgroundColor: "#F59E0B", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  cartBadgeText:      { color: "#fff", fontWeight: "700", fontSize: 13 },
  description:        { padding: 16, fontSize: 13, color: "#666", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionTitle:       { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  menuList:           { padding: 16, gap: 10 },
  menuCard:           { backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  menuCardInfo:       { flex: 1 },
  menuItemName:       { fontSize: 15, fontWeight: "700", color: "#111" },
  menuItemDesc:       { fontSize: 12, color: "#999", marginTop: 3 },
  menuItemPrice:      { fontSize: 14, fontWeight: "700", color: "#F59E0B", marginTop: 6 },
  menuCardAction:     { marginLeft: 12 },
  addBtn:             { width: 36, height: 36, borderRadius: 18, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  addBtnText:         { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  qtyRow:             { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn:             { width: 32, height: 32, borderRadius: 16, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  qtyBtnText:         { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 20 },
  qtyNum:             { fontSize: 15, fontWeight: "700", color: "#111", minWidth: 20, textAlign: "center" },
  floatingCart:       { position: "absolute", bottom: 24, left: 20, right: 20, backgroundColor: "#111", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  floatingCartText:   { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty:              { alignItems: "center", marginTop: 60 },
  emptyIcon:          { fontSize: 48, marginBottom: 12 },
  emptyText:          { fontSize: 15, color: "#aaa" },
  cartHeader:         { backgroundColor: "#111", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cartTitle:          { fontSize: 20, fontWeight: "800", color: "#fff" },
  cartCount:          { fontSize: 13, color: "#aaa" },
  cartList:           { flex: 1, padding: 16 },
  cartItem:           { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cartItemInfo:       { flex: 1 },
  cartItemName:       { fontSize: 15, fontWeight: "600", color: "#111" },
  cartItemPrice:      { fontSize: 13, color: "#F59E0B", fontWeight: "700", marginTop: 4 },
  orderTypeRow:       { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 16 },
  typeBtn:            { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#ddd", alignItems: "center", backgroundColor: "#fff" },
  typeBtnActive:      { borderColor: "#111", backgroundColor: "#111" },
  typeBtnText:        { fontSize: 13, fontWeight: "600", color: "#555" },
  typeBtnTextActive:  { color: "#fff" },
  addressBox:         { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  addressLabel:       { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 8 },
  addressInput:       { fontSize: 14, color: "#111", borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 12, minHeight: 60 },
  cartFooter:         { padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
  totalRow:           { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  totalLabel:         { fontSize: 16, color: "#555" },
  totalAmount:        { fontSize: 20, fontWeight: "800", color: "#111" },
  orderBtn:           { backgroundColor: "#111", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  orderBtnText:       { color: "#fff", fontWeight: "700", fontSize: 16 },
});