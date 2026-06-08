import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
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

        {/* Logo */}
        <View style={styles.logoBox}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🚀</Text>
          </View>
          <Text style={styles.logo}>KAVIROQ</Text>
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
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput style={styles.input} placeholder="Jean Kouassi" placeholderTextColor="rgba(255,255,255,0.3)" value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput style={styles.input} placeholder="votre@email.com" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.3)" value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={[styles.inputBox, confirm && password !== confirm && styles.inputError]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.3)" value={confirm} onChangeText={setConfirm} secureTextEntry />
            </View>
          </View>

          {/* ✅ Sélection de rôle modernisée */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Je suis</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === "client" && styles.roleBtnActive]}
                onPress={() => setRole("client")}
                activeOpacity={0.8}
              >
                {role === "client" && <View style={styles.roleGlow} />}
                <Text style={styles.roleEmoji}>🙋</Text>
                <Text style={[styles.roleText, role === "client" && styles.roleTextActive]}>Client</Text>
                <Text style={styles.roleDesc}>Je commande</Text>
                {role === "client" && <View style={styles.roleCheck}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>✓</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === "business" && styles.roleBtnActiveBusiness]}
                onPress={() => setRole("business")}
                activeOpacity={0.8}
              >
                {role === "business" && <View style={[styles.roleGlow, { backgroundColor: "rgba(255,107,53,0.15)" }]} />}
                <Text style={styles.roleEmoji}>🏪</Text>
                <Text style={[styles.roleText, role === "business" && styles.roleTextActiveBusiness]}>Entreprise</Text>
                <Text style={styles.roleDesc}>Je vends</Text>
                {role === "business" && <View style={[styles.roleCheck, { backgroundColor: "#FF6B35" }]}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>✓</Text></View>}
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ Bouton principal */}
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
                    <Text style={styles.btnArrow}>→</Text>
                  </>
              }
            </View>
          </TouchableOpacity>

          {/* ✅ Bouton secondaire glassmorphisme */}
          <TouchableOpacity
            style={styles.btnGlass}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.btnGlassText}>
              Déjà un compte ? <Text style={styles.btnGlassHighlight}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: "#0F0F1E" },
  content:                { flexGrow: 1, padding: 24, paddingTop: 50 },

  circle1:                { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(108,63,197,0.15)", top: -80, right: -80 },
  circle2:                { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,107,53,0.1)", bottom: 80, left: -60 },
  circle3:                { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(33,150,243,0.06)", top: 250, left: 20 },

  logoBox:                { alignItems: "center", marginBottom: 28, marginTop: 10 },
  logoIcon:               { width: 68, height: 68, borderRadius: 20, backgroundColor: "rgba(255,107,53,0.12)", borderWidth: 1.5, borderColor: "rgba(255,107,53,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 14,
                            shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  logoEmoji:              { fontSize: 30 },
  logo:                   { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 4 },
  tagline:                { fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 },

  form:                   { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
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
  inputIcon:              { fontSize: 16, marginRight: 10 },
  input:                  { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 13 },

  // ✅ Rôles modernisés
  roleRow:                { flexDirection: "row", gap: 12 },
  roleBtn:                { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)", gap: 4, overflow: "hidden", position: "relative" },
  roleBtnActive:          { borderColor: "#6C3FC5", backgroundColor: "rgba(108,63,197,0.1)" },
  roleBtnActiveBusiness:  { borderColor: "#FF6B35", backgroundColor: "rgba(255,107,53,0.1)" },
  roleGlow:               { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(108,63,197,0.08)", borderRadius: 16 },
  roleEmoji:              { fontSize: 26 },
  roleText:               { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 13 },
  roleTextActive:         { color: "#A78BFA" },
  roleTextActiveBusiness: { color: "#FF6B35" },
  roleDesc:               { fontSize: 11, color: "rgba(255,255,255,0.25)" },
  roleCheck:              { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#6C3FC5", alignItems: "center", justifyContent: "center" },

  // ✅ Bouton principal
  btn:                    { borderRadius: 16, marginTop: 8, overflow: "hidden",
                            shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  btnInner:               { backgroundColor: "#FF6B35", paddingVertical: 16, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                            borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  btnText:                { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },
  btnArrow:               { color: "rgba(255,255,255,0.8)", fontSize: 18, fontWeight: "700" },

  // ✅ Bouton glassmorphisme
  btnGlass:               { marginTop: 12, borderRadius: 14, paddingVertical: 14, alignItems: "center",
                            backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  btnGlassText:           { color: "rgba(255,255,255,0.45)", fontSize: 14 },
  btnGlassHighlight:      { color: "#FF6B35", fontWeight: "700" },
});
