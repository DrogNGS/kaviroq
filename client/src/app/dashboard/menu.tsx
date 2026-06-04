import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Switch, Modal,
} from "react-native";
import { useRouter } from "expo-router";
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
  isOpen: boolean;
  menu: MenuItem[];
};

const EMPTY_FORM = { name: "", price: "", description: "", available: true };

export default function MenuManagementScreen() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const getToken = async () => AsyncStorage.getItem("kaviroq_token");

  const fetchBusiness = useCallback(async () => {
    try {
      const token = await getToken();
      // Récupérer les entreprises du propriétaire
      const res = await fetch(`${API_URL}/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Prendre la première entreprise du propriétaire
      if (Array.isArray(data) && data.length > 0) {
        setBusiness(data[0]);
      } else if (data._id) {
        setBusiness(data);
      }
    } catch {
      Alert.alert("Erreur", "Impossible de charger votre menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBusiness(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, price: String(item.price), description: item.description || "", available: item.available });
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!form.name.trim() || !form.price) {
      Alert.alert("Erreur", "Nom et prix sont requis."); return;
    }
    if (!business) return;
    setSaving(true);
    try {
      const token = await getToken();
      let newMenu: MenuItem[];

      if (editItem) {
        // Modifier un plat existant
        newMenu = business.menu.map((item) =>
          item._id === editItem._id
            ? { ...item, name: form.name, price: parseFloat(form.price), description: form.description, available: form.available }
            : item
        );
      } else {
        // Ajouter un nouveau plat
        newMenu = [...business.menu, {
          _id: Date.now().toString(),
          name: form.name,
          price: parseFloat(form.price),
          description: form.description,
          available: form.available,
        }];
      }

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
    Alert.alert("Supprimer", "Voulez-vous supprimer ce plat ?", [
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
          if (res.ok) {
            const updated = await res.json();
            setBusiness(updated);
          }
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
    if (res.ok) {
      const updated = await res.json();
      setBusiness(updated);
    }
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
          <Text style={styles.title}>Gestion du menu</Text>
          {business && <Text style={styles.businessName}>{business.name}</Text>}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Statut ouverture */}
      {business && (
        <View style={styles.openRow}>
          <Text style={styles.openLabel}>Restaurant {business.isOpen ? "ouvert" : "fermé"}</Text>
          <Switch
            value={business.isOpen}
            onValueChange={toggleOpen}
            trackColor={{ false: "#ddd", true: "#10B981" }}
            thumbColor="#fff"
          />
        </View>
      )}

      {/* Liste des plats */}
      <FlatList
        data={business?.menu || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>Aucun plat — ajoutez-en un !</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.available && styles.cardDisabled]}>
            <View style={styles.cardInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
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
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editItem ? "Modifier le plat" : "Nouveau plat"}</Text>

            <Text style={styles.inputLabel}>Nom du plat *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Poulet braisé"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />

            <Text style={styles.inputLabel}>Prix (FCFA) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2500"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Description du plat (optionnel)"
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
            />

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
  card:          { backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardDisabled:  { opacity: 0.5 },
  cardInfo:      { flex: 1 },
  itemName:      { fontSize: 15, fontWeight: "700", color: "#111" },
  itemDesc:      { fontSize: 12, color: "#999", marginTop: 3 },
  itemPrice:     { fontSize: 14, fontWeight: "700", color: "#F59E0B", marginTop: 6 },
  cardActions:   { flexDirection: "row", alignItems: "center", gap: 8 },
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
  switchRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBtns:     { flexDirection: "row", gap: 12 },
  cancelBtn:     { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#ddd", alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#555" },
  saveBtn:       { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#111", alignItems: "center" },
  saveBtnText:   { fontSize: 15, fontWeight: "700", color: "#fff" },
});
