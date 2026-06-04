import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Switch, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

// Catégories de produits selon le type d'entreprise
const BUSINESS_SPECS: Record<string, { productCategories: string[]; specFields: { key: string; label: string; placeholder: string }[] }> = {
  restaurant: {
    productCategories: ["Entrée", "Plat principal", "Dessert", "Boisson", "Menu complet"],
    specFields: [
      { key: "allergenes", label: "Allergènes", placeholder: "Ex: gluten, lactose..." },
      { key: "calories", label: "Calories", placeholder: "Ex: 450 kcal" },
      { key: "preparation", label: "Temps de préparation", placeholder: "Ex: 15 min" },
    ],
  },
  hotel: {
    productCategories: ["Chambre simple", "Chambre double", "Suite", "Appartement", "Salle de conférence"],
    specFields: [
      { key: "capacite", label: "Capacité (personnes)", placeholder: "Ex: 2" },
      { key: "superficie", label: "Superficie (m²)", placeholder: "Ex: 25" },
      { key: "equipements", label: "Équipements", placeholder: "Ex: WiFi, TV, Clim..." },
      { key: "vue", label: "Vue", placeholder: "Ex: vue mer, vue jardin..." },
    ],
  },
  patisserie: {
    productCategories: ["Gâteau", "Viennoiserie", "Tarte", "Confiserie", "Boisson"],
    specFields: [
      { key: "allergenes", label: "Allergènes", placeholder: "Ex: gluten, lactose..." },
      { key: "portions", label: "Nombre de portions", placeholder: "Ex: 8 parts" },
      { key: "conservation", label: "Conservation", placeholder: "Ex: 3 jours au frais" },
    ],
  },
  maquis: {
    productCategories: ["Plat local", "Grillades", "Boisson", "Entrée", "Dessert"],
    specFields: [
      { key: "accompagnement", label: "Accompagnement", placeholder: "Ex: attiéké, riz..." },
      { key: "epice", label: "Niveau épicé", placeholder: "Ex: doux, moyen, fort" },
    ],
  },
  salon: {
    productCategories: ["Coiffure", "Soin visage", "Soin corps", "Manucure", "Massage"],
    specFields: [
      { key: "duree", label: "Durée", placeholder: "Ex: 1h30" },
      { key: "pour", label: "Pour", placeholder: "Ex: homme, femme, enfant" },
    ],
  },
  fast_food: {
    productCategories: ["Burger", "Sandwich", "Frites", "Boisson", "Menu complet"],
    specFields: [
      { key: "taille", label: "Taille", placeholder: "Ex: S, M, L" },
      { key: "allergenes", label: "Allergènes", placeholder: "Ex: gluten..." },
    ],
  },
  cafe: {
    productCategories: ["Café", "Thé", "Jus", "Snack", "Boisson chaude"],
    specFields: [
      { key: "temperature", label: "Température", placeholder: "Ex: chaud, froid" },
      { key: "taille", label: "Taille", placeholder: "Ex: petit, grand" },
    ],
  },
  commerce: {
    productCategories: ["Vêtement", "Électronique", "Alimentaire", "Cosmétique", "Autre"],
    specFields: [
      { key: "marque", label: "Marque", placeholder: "Ex: Samsung, Nike..." },
      { key: "taille", label: "Taille/Pointure", placeholder: "Ex: XL, 42..." },
      { key: "couleur", label: "Couleur", placeholder: "Ex: rouge, bleu..." },
      { key: "stock", label: "Stock disponible", placeholder: "Ex: 10 unités" },
    ],
  },
};

const DEFAULT_SPECS = {
  productCategories: ["Produit", "Service", "Autre"],
  specFields: [
    { key: "detail", label: "Détail", placeholder: "Informations supplémentaires" },
  ],
};

type Product = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  available: boolean;
  category?: string;
  specs?: Record<string, string>;
};

type Business = {
  _id: string;
  name: string;
  category: string;
  isOpen: boolean;
  menu: Product[];
};

const EMPTY_FORM = { name: "", price: "", description: "", available: true, category: "", specs: {} as Record<string, string> };

export default function CatalogueScreen() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const getToken = async () => AsyncStorage.getItem("kaviroq_token");

  const fetchBusiness = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/businesses/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setBusiness(data[0]);
      else if (data._id) setBusiness(data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger votre catalogue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBusiness(); }, []);

  const specs = business ? (BUSINESS_SPECS[business.category] || DEFAULT_SPECS) : DEFAULT_SPECS;

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, category: specs.productCategories[0] });
    setShowModal(true);
  };

  const openEdit = (item: Product) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description || "",
      available: item.available,
      category: item.category || specs.productCategories[0],
      specs: item.specs || {},
    });
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!form.name.trim() || !form.price) { Alert.alert("Erreur", "Nom et prix sont requis."); return; }
    if (!business) return;
    setSaving(true);
    try {
      const token = await getToken();
      const newProduct = {
        _id: editItem?._id || Date.now().toString(),
        name: form.name,
        price: parseFloat(form.price),
        description: form.description,
        available: form.available,
        category: form.category,
        specs: form.specs,
      };

      const newMenu = editItem
        ? business.menu.map((item) => item._id === editItem._id ? newProduct : item)
        : [...business.menu, newProduct];

      const res = await fetch(`${API_URL}/businesses/${business._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ menu: newMenu }),
      });

      if (!res.ok) throw new Error();
      const updated = await res.json();
      setBusiness(updated);
      setShowModal(false);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = (itemId: string) => {
    Alert.alert("Supprimer", "Voulez-vous supprimer ce produit ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          if (!business) return;
          const token = await getToken();
          const newMenu = business.menu.filter((item) => item._id !== itemId);
          const res = await fetch(`${API_URL}/businesses/${business._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ menu: newMenu }),
          });
          if (res.ok) { const updated = await res.json(); setBusiness(updated); }
        }
      }
    ]);
  };

  const toggleOpen = async () => {
    if (!business) return;
    const token = await getToken();
    const res = await fetch(`${API_URL}/businesses/${business._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isOpen: !business.isOpen }),
    });
    if (res.ok) { const updated = await res.json(); setBusiness(updated); }
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      restaurant: "🍔", hotel: "🏨", patisserie: "🎂", maquis: "🍖",
      salon: "💇", fast_food: "🍟", cafe: "☕", commerce: "🛒",
    };
    return icons[cat] || "🏪";
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#111" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Catalogue</Text>
          {business && (
            <Text style={styles.businessName}>
              {getCategoryIcon(business.category)} {business.name}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Statut ouverture */}
      {business && (
        <View style={styles.openRow}>
          <Text style={styles.openLabel}>
            {business.isOpen ? "🟢 Ouvert" : "🔴 Fermé"}
          </Text>
          <Switch
            value={business.isOpen}
            onValueChange={toggleOpen}
            trackColor={{ false: "#ddd", true: "#10B981" }}
            thumbColor="#fff"
          />
        </View>
      )}

      {/* Grouper par catégorie */}
      <FlatList
        data={business?.menu || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Aucun produit — ajoutez-en un !</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.available && styles.cardDisabled]}>
            <View style={styles.cardInfo}>
              {item.category && (
                <View style={styles.catPill}>
                  <Text style={styles.catPillText}>{item.category}</Text>
                </View>
              )}
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
              {item.specs && Object.keys(item.specs).length > 0 && (
                <View style={styles.specsRow}>
                  {Object.entries(item.specs).map(([k, v]) => v ? (
                    <Text key={k} style={styles.specTag}>• {v}</Text>
                  ) : null)}
                </View>
              )}
              <Text style={styles.itemPrice}>{item.price.toFixed(0)} FCFA</Text>
            </View>
            <View style={styles.cardActions}>
              <View style={[styles.availBadge, { backgroundColor: item.available ? "#10B98122" : "#EF444422" }]}>
                <Text style={[styles.availText, { color: item.available ? "#10B981" : "#EF4444" }]}>
                  {item.available ? "Dispo" : "Indispo"}
                </Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(item._id)}>
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal ajout/modification */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editItem ? "Modifier" : "Nouveau produit"}</Text>

              {/* Catégorie produit */}
              <Text style={styles.inputLabel}>Type de produit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {specs.productCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
                      onPress={() => setForm({ ...form, category: cat })}
                    >
                      <Text style={[styles.catBtnText, form.category === cat && styles.catBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom du produit"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />

              <Text style={styles.inputLabel}>Prix (FCFA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5000"
                value={form.price}
                onChangeText={(v) => setForm({ ...form, price: v })}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Description du produit"
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                multiline
              />

              {/* Spécifications dynamiques selon le type d'entreprise */}
              {specs.specFields.length > 0 && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 8, color: "#666" }]}>
                    Spécifications
                  </Text>
                  {specs.specFields.map((field) => (
                    <View key={field.key}>
                      <Text style={styles.inputLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={field.placeholder}
                        value={form.specs[field.key] || ""}
                        onChangeText={(v) => setForm({ ...form, specs: { ...form.specs, [field.key]: v } })}
                      />
                    </View>
                  ))}
                </>
              )}

              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Disponible</Text>
                <Switch
                  value={form.available}
                  onValueChange={(v) => setForm({ ...form, available: v })}
                  trackColor={{ false: "#ddd", true: "#10B981" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveItem} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Sauvegarder</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#F8F8F6" },
  header:        { backgroundColor: "#111", paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:       { color: "#fff", fontSize: 22, fontWeight: "600" },
  headerInfo:    { flex: 1 },
  title:         { fontSize: 20, fontWeight: "800", color: "#fff" },
  businessName:  { fontSize: 13, color: "#aaa", marginTop: 2 },
  addBtn:        { backgroundColor: "#F59E0B", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText:    { color: "#fff", fontWeight: "700", fontSize: 13 },
  openRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  openLabel:     { fontSize: 15, fontWeight: "600", color: "#111" },
  list:          { padding: 16, gap: 10 },
  card:          { backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "flex-start", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardDisabled:  { opacity: 0.5 },
  cardInfo:      { flex: 1 },
  catPill:       { backgroundColor: "#F59E0B22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start", marginBottom: 6 },
  catPillText:   { fontSize: 11, fontWeight: "700", color: "#F59E0B" },
  itemName:      { fontSize: 15, fontWeight: "700", color: "#111" },
  itemDesc:      { fontSize: 12, color: "#999", marginTop: 3 },
  specsRow:      { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  specTag:       { fontSize: 11, color: "#666", backgroundColor: "#f5f5f5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemPrice:     { fontSize: 14, fontWeight: "700", color: "#F59E0B", marginTop: 6 },
  cardActions:   { flexDirection: "column", alignItems: "center", gap: 8, marginLeft: 8 },
  availBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  availText:     { fontSize: 11, fontWeight: "700" },
  editBtn:       { padding: 6 },
  editBtnText:   { fontSize: 18 },
  deleteBtn:     { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  empty:         { alignItems: "center", marginTop: 80 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 15, color: "#aaa" },
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox:      { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:    { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 20 },
  inputLabel:    { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input:         { borderWidth: 1.5, borderColor: "#eee", borderRadius: 10, padding: 12, fontSize: 15, color: "#111", marginBottom: 14 },
  inputMulti:    { minHeight: 70, textAlignVertical: "top" },
  catBtn:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: "#ddd", backgroundColor: "#fff" },
  catBtnActive:  { backgroundColor: "#111", borderColor: "#111" },
  catBtnText:    { fontSize: 12, fontWeight: "600", color: "#555" },
  catBtnTextActive: { color: "#fff" },
  switchRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBtns:     { flexDirection: "row", gap: 12 },
  cancelBtn:     { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#ddd", alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#555" },
  saveBtn:       { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#111", alignItems: "center" },
  saveBtnText:   { fontSize: 15, fontWeight: "700", color: "#fff" },
});
