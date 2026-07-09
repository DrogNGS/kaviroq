import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView, Image, Platform
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser]             = useState<User | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editing, setEditing]       = useState(false);
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [avatar, setAvatar]         = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage]       = useState<{ text: string; type: "success" | "error" } | null>(null);

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
      setAvatar(data.avatar ?? null);
    } catch {
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

// ✅ Upload photo de profil
const pickAvatar = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission refusée", "Autorisez l'accès à la galerie dans les paramètres.");
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (!result.canceled && result.assets[0]) {
    setUploadingPhoto(true);
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      const asset = result.assets[0];
      const formData = new FormData();

      if (Platform.OS === "web") {
        const base64 = asset.base64!;
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: "image/jpeg" });
        formData.append("image", blob, "avatar.jpg");
      } else {
        formData.append("image", {
          uri: asset.uri,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvatar(data.url);

      await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, avatar: data.url }),
      });

      const userJson = await AsyncStorage.getItem("kaviroq_user");
      if (userJson) {
        const userObj = JSON.parse(userJson);
        await AsyncStorage.setItem("kaviroq_user", JSON.stringify({ ...userObj, avatar: data.url }));
      }

      setMessage({ text: "Photo mise à jour !", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      Alert.alert("Erreur", "Impossible d'uploader la photo");
    } finally {
      setUploadingPhoto(false);
    }
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
        body: JSON.stringify({ name, email, avatar })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data);

      // ✅ Sauvegarder l'objet complet dans AsyncStorage
      await AsyncStorage.setItem("kaviroq_user", JSON.stringify({ ...data, avatar }));

      setEditing(false);
      setMessage({ text: "Profil mis à jour !", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ text: "Impossible de sauvegarder", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui", style: "destructive",
            onPress: async () => {
        try {
          const { logout } = await import("../services/authService");
          await logout();
        } catch {
          await AsyncStorage.multiRemove(["kaviroq_token", "kaviroq_user", "userRole"]);
        }
        router.replace("/login");
      }
      }
    ]);
  };

  const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const formatDate  = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const getRoleInfo = (role: string) => ({
    client:   { label: "Client",       color: theme.accent,  bg: "rgba(168,85,247,0.2)" },
    business: { label: "Restaurateur", color: theme.primary, bg: "rgba(255,107,53,0.2)" },
    admin:    { label: "Admin",        color: "#10B981",      bg: "rgba(16,185,129,0.2)" },
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
            <Text style={styles.editBtnText}>{editing ? "Annuler" : "✏️ Modifier"}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ✅ Avatar avec bouton photo */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} disabled={uploadingPhoto}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(user?.name ?? "?")}</Text>
                </View>
              </View>
            )}
            {/* Overlay bouton photo */}
            <View style={styles.cameraOverlay}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.cameraIcon}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          <Text style={styles.photoHint}>Appuyez pour changer la photo</Text>
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
              {message.type === "success" ? "✅ " : "⚠️ "}{message.text}
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
                <Text style={styles.inputIcon}>👤</Text>
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
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
            ) : (
              <Text style={styles.fieldValue}>{user?.email}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Rôle</Text>
            <Text style={styles.fieldValue}>{roleInfo.label}</Text>
          </View>

          {editing && (
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Sauvegarder</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Accès rapide */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accès rapide</Text>
          {[
            { icon: "📋", label: "Mes commandes",   onPress: () => router.push("/history") },
            { icon: "💬", label: "Mes messages", onPress: () => router.push("/conversations") },
            { icon: "🔔", label: "Notifications",   onPress: () => router.push("/notifications") },
            ...(user?.role === "business" ? [{ icon: "⚙️", label: "Tableau de bord", onPress: () => router.push("/admin") }] : []),
          ].map((item, i, arr) => (
            <View key={i}>
              <TouchableOpacity style={styles.actionItem} onPress={item.onPress}>
                <View style={styles.actionIconBox}>
                  <Text style={styles.actionIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionArrow}>›</Text>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
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

  // ✅ Avatar avec photo
  avatarSection:   { alignItems: "center", padding: 24, gap: 8 },
  avatarWrapper:   { position: "relative", marginBottom: 4 },
  avatarImage:     { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: theme.primary },
  avatarRing:      { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: theme.primary, padding: 3 },
  avatar:          { flex: 1, borderRadius: 45, backgroundColor: "rgba(255,107,53,0.3)", alignItems: "center", justifyContent: "center" },
  avatarText:      { color: "#fff", fontSize: 28, fontWeight: "800" },
  cameraOverlay:   { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.dark },
  cameraIcon:      { fontSize: 14 },
  photoHint:       { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: -4 },
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
