import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../store/AuthContext";
import { theme } from "../theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [role, setRole]         = useState<"client" | "business">("client");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      setMessage({ text: "Remplis tous les champs !", type: "error" }); return;
    }
    if (password !== confirm) {
      setMessage({ text: "Les mots de passe ne correspondent pas", type: "error" }); return;
    }
    if (password.length < 6) {
      setMessage({ text: "Mot de passe trop court (6 caractères min)", type: "error" }); return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await register({ name, email, password, role });
      setMessage({ text: "Compte créé avec succès !", type: "success" });
      setTimeout(() => {
        if (role === "business") router.replace("/dashboard");
        else router.replace("/home");
      }, 1000);
    } catch (e: any) {
      setMessage({ text: e.message ?? "Erreur lors de l'inscription", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Cercles décoratifs */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Logo centré, même traitement que l'écran de connexion */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCard}>
            <Image
              source={require("../../assets/images/kaviroq_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.tagline}>Créez votre compte gratuitement</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {message && (
            <View style={[styles.msgBox, message.type === "error" ? styles.msgError : styles.msgSuccess]}>
              <Text style={[styles.msgText, message.type === "error" ? styles.msgTextError : styles.msgTextSuccess]}>
                {message.type === "error" ? "⚠️ " : "✅ "}{message.text}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Jean Kouassi" placeholderTextColor="rgba(255,255,255,0.3)" value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="votre@email.com" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.3)" value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={[styles.inputBox, confirm && password !== confirm && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.3)" value={confirm} onChangeText={setConfirm} secureTextEntry />
            </View>
          </View>

          {/* Sélection de rôle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Je suis</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === "client" && styles.roleBtnActive]}
                onPress={() => setRole("client")}
                activeOpacity={0.8}
              >
                {role === "client" && <View style={styles.roleGlow} />}
                <Ionicons name="person-circle-outline" size={26} color={role === "client" ? "#A78BFA" : "rgba(255,255,255,0.4)"} />
                <Text style={[styles.roleText, role === "client" && styles.roleTextActive]}>Client</Text>
                <Text style={styles.roleDesc}>Je commande</Text>
                {role === "client" && <View style={styles.roleCheck}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === "business" && styles.roleBtnActiveBusiness]}
                onPress={() => setRole("business")}
                activeOpacity={0.8}
              >
                {role === "business" && <View style={[styles.roleGlow, { backgroundColor: "rgba(255,107,53,0.15)" }]} />}
                <Ionicons name="storefront-outline" size={26} color={role === "business" ? "#FF6B35" : "rgba(255,255,255,0.4)"} />
                <Text style={[styles.roleText, role === "business" && styles.roleTextActiveBusiness]}>Entreprise</Text>
                <Text style={styles.roleDesc}>Je vends</Text>
                {role === "business" && <View style={[styles.roleCheck, { backgroundColor: "#FF6B35" }]}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton principal */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.btnInner}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={styles.btnText}>Créer mon compte</Text>
                    <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
                  </>
              }
            </View>
          </TouchableOpacity>

          {/* Lien secondaire, sobre — cohérent avec l'écran de connexion */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/login")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Déjà un compte ? <Text style={styles.linkHighlight}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: "#0F0F1E" },
  content:                { flexGrow: 1, padding: 24, paddingTop: 56, alignItems: "center" },

  circle1:                { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(108,63,197,0.15)", top: -80, right: -80 },
  circle2:                { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,107,53,0.1)", bottom: 80, left: -60 },
  circle3:                { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(33,150,243,0.06)", top: 250, left: 20 },

  // Logo centré, même carte que login.tsx
  logoWrap:               { alignItems: "center", marginBottom: 28, width: "100%" },
  logoCard:               { backgroundColor: "#fff", borderRadius: 24, paddingVertical: 18, paddingHorizontal: 26, marginBottom: 12,
                            shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  logoImage:              { width: 130, height: 78 },
  tagline:                { fontSize: 13, color: "rgba(255,255,255,0.4)" },

  form:                   { width: "100%", maxWidth: 420, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                            shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 10 },

  msgBox:                 { borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  msgError:               { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" },
  msgSuccess:             { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" },
  msgText:                { fontSize: 13 },
  msgTextError:           { color: "#FCA5A5" },
  msgTextSuccess:         { color: "#6EE7B7" },

  inputGroup:             { marginBottom: 14 },
  label:                  { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  inputBox:               { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14 },
  inputError:             { borderColor: "rgba(239,68,68,0.4)" },
  inputIcon:              { marginRight: 10 },
  input:                  { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 13 },

  // Rôles
  roleRow:                { flexDirection: "row", gap: 12 },
  roleBtn:                { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)", gap: 4, overflow: "hidden", position: "relative" },
  roleBtnActive:          { borderColor: "#6C3FC5", backgroundColor: "rgba(108,63,197,0.1)" },
  roleBtnActiveBusiness:  { borderColor: "#FF6B35", backgroundColor: "rgba(255,107,53,0.1)" },
  roleGlow:               { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(108,63,197,0.08)", borderRadius: 16 },
  roleText:               { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 13 },
  roleTextActive:         { color: "#A78BFA" },
  roleTextActiveBusiness: { color: "#FF6B35" },
  roleDesc:               { fontSize: 11, color: "rgba(255,255,255,0.25)" },
  roleCheck:              { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#6C3FC5", alignItems: "center", justifyContent: "center" },

  // Bouton principal
  btn:                    { borderRadius: 16, marginTop: 8, overflow: "hidden",
                            shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  btnInner:               { backgroundColor: "#FF6B35", paddingVertical: 16, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                            borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  btnText:                { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  // Lien secondaire sobre — identique à login.tsx
  linkRow:                { marginTop: 20, alignItems: "center" },
  linkText:               { color: "rgba(255,255,255,0.45)", fontSize: 14 },
  linkHighlight:          { color: "#FF6B35", fontWeight: "700" },
});
