import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { router.replace("/login"); return; }
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);
      setName(data.name);
      setEmail(data.email);
    } catch {
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!name || !email) { setMessage({ text: "Remplis tous les champs", type: "error" }); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);
      await AsyncStorage.setItem("kaviroq_user", data.name);
      setEditing(false);
      setMessage({ text: "Profil mis Ã  jour !", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: "Impossible de sauvegarder", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("DÃ©connexion", "Voulez-vous vous dÃ©connecter ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["kaviroq_token", "kaviroq_user", "kaviroq_user", "userRole"]);
          router.replace("/login");
        }
      }
    ]);
  };

  const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const formatDate  = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const getRoleInfo = (role: string) => ({
    client:   { label: "Client",       color: theme.accent,   bg: "rgba(168,85,247,0.2)"  },
    business: { label: "Restaurateur", color: theme.primary,  bg: "rgba(255,107,53,0.2)"  },
    admin:    { label: "Admin",        color: "#10B981",       bg: "rgba(16,185,129,0.2)"  },
  }[role] ?? { label: role, color: "#999", bg: "rgba(255,255,255,0.1)" });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const roleInfo = getRoleInfo(user?.role ?? "client");

  return (
    <View style={styles.container}>
      <AppHeader
        title="Mon profil"
        rightElement={
          <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>{editing ? "Annuler" : "âœï¸ Modifier"}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name ?? "?")}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
          <Text style={styles.memberSince}>Membre depuis {formatDate(user?.createdAt ?? "")}</Text>
        </View>

        {/* Message */}
        {message && (
          <View style={[styles.msgBox, message.type === "success" ? styles.msgSuccess : styles.msgError]}>
            <Text style={[styles.msgText, message.type === "success" ? styles.msgTextSuccess : styles.msgTextError]}>
              {message.type === "success" ? "âœ… " : "âš ï¸ "}{message.text}
            </Text>
          </View>
        )}

        {/* Infos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nom complet</Text>
            {editing ? (
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>ðŸ‘¤</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
            ) : (
              <Text style={styles.fieldValue}>{user?.name}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            {editing ? (
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>ðŸ“§</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
            ) : (
              <Text style={styles.fieldValue}>{user?.email}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>RÃ´le</Text>
            <Text style={styles.fieldValue}>{roleInfo.label}</Text>
          </View>

          {editing && (
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ðŸ’¾ Sauvegarder</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* AccÃ¨s rapide */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AccÃ¨s rapide</Text>
          {[
            { icon: "ðŸ“‹", label: "Mes commandes",   onPress: () => router.push("/history") },
            { icon: "ðŸ’¬", label: "Mes messages",    onPress: () => router.push({ pathname: "/chat", params: { businessName: "Support", roomId: "support_1" } }) },
            { icon: "ðŸ””", label: "Notifications",   onPress: () => router.push("/notifications") },
            ...(user?.role === "business" ? [{ icon: "âš™ï¸", label: "Tableau de bord", onPress: () => router.push("/admin") }] : []),
          ].map((item, i, arr) => (
            <View key={i}>
              <TouchableOpacity style={styles.actionItem} onPress={item.onPress}>
                <View style={styles.actionIconBox}>
                  <Text style={styles.actionIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionArrow}>â€º</Text>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* DÃ©connexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>ðŸšª Se dÃ©connecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.dark },
  centered:        { flex: 1, alignItems: "center", justifyContent: "center" },
  editBtn:         { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editBtnText:     { color: "#fff", fontSize: 13, fontWeight: "600" },
  avatarSection:   { alignItems: "center", padding: 24, gap: 8 },
  avatarRing:      { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: theme.primary, padding: 3, marginBottom: 4 },
  avatar:          { flex: 1, borderRadius: 45, backgroundColor: "rgba(255,107,53,0.3)", alignItems: "center", justifyContent: "center" },
  avatarText:      { color: "#fff", fontSize: 28, fontWeight: "800" },
  userName:        { fontSize: 22, fontWeight: "800", color: "#fff" },
  roleBadge:       { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText:        { fontSize: 13, fontWeight: "600" },
  memberSince:     { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  msgBox:          { marginHorizontal: 15, marginBottom: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  msgSuccess:      { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.3)" },
  msgError:        { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)" },
  msgText:         { fontSize: 13 },
  msgTextSuccess:  { color: "#6EE7B7" },
  msgTextError:    { color: "#FCA5A5" },
  card:            { backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 15, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardTitle:       { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 16 },
  field:           { paddingVertical: 8 },
  fieldLabel:      { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 },
  fieldValue:      { fontSize: 15, color: "#fff", fontWeight: "500" },
  inputBox:        { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12 },
  inputIcon:       { fontSize: 16, marginRight: 8 },
  input:           { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 12 },
  divider:         { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 4 },
  saveBtn:         { backgroundColor: theme.primary, borderRadius: 10, padding: 13, alignItems: "center", marginTop: 14 },
  saveBtnText:     { color: "#fff", fontWeight: "700", fontSize: 15 },
  actionItem:      { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  actionIconBox:   { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  actionIcon:      { fontSize: 18 },
  actionLabel:     { flex: 1, fontSize: 15, color: "rgba(255,255,255,0.85)" },
  actionArrow:     { fontSize: 20, color: "rgba(255,255,255,0.3)" },
  logoutBtn:       { marginHorizontal: 15, marginBottom: 20, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 12, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  logoutText:      { color: "#FCA5A5", fontWeight: "700", fontSize: 15 },
});
