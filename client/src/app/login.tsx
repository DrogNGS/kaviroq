import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../store/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import { loginWithGoogle } from "../services/authService";
import { registerForPushNotificationsAsync, savePushTokenToBackend } from "../services/notifications";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const afterAuthSuccess = async () => {
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      await savePushTokenToBackend(pushToken);
    }
    const userJson = await AsyncStorage.getItem("kaviroq_user");
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === "business") router.replace("/dashboard");
      else router.replace("/home");
    } else {
      router.replace("/home");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { setMessage("Remplis tous les champs !"); return; }
    setLoading(true);
    setMessage("");
    try {
      await login({ email, password });
      setTimeout(afterAuthSuccess, 100);
    } catch (e: any) {
      setMessage(e.message ?? "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setMessage("");
    try {
      await loginWithGoogle();
      await afterAuthSuccess();
    } catch (e: any) {
      setMessage(e.message ?? "Erreur connexion Google");
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

        {/* Logo centré dans une carte propre */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCard}>
            <Image
              source={require("../../assets/images/kaviroq_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {message ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {message}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Bouton principal */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.btnInner}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={styles.btnText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
                  </>
              }
            </View>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Bouton Google */}
          <TouchableOpacity
            style={styles.btnGoogle}
            onPress={handleGoogle}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={18} color="#333" style={{ marginRight: 10 }} />
            <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Lien secondaire, sobre */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/register")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Pas de compte ? <Text style={styles.linkHighlight}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#0F0F1E" },
  content:            { flexGrow: 1, padding: 24, paddingTop: 72, alignItems: "center" },

  // Cercles décoratifs
  circle1:            { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(108,63,197,0.15)", top: -80, right: -80 },
  circle2:            { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,107,53,0.1)", bottom: 80, left: -60 },
  circle3:            { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(33,150,243,0.08)", top: 200, left: 30 },

  // Logo centré, dans une carte assumée (le fichier source a un fond blanc)
  logoWrap:           { alignItems: "center", marginBottom: 36, width: "100%" },
  logoCard:           { backgroundColor: "#fff", borderRadius: 24, paddingVertical: 20, paddingHorizontal: 28,
                        shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  logoImage:          { width: 150, height: 90 },

  // Formulaire glassmorphisme
  form:               { width: "100%", maxWidth: 420, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                        shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 10 },

  errorBox:           { backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  errorText:          { color: "#FCA5A5", fontSize: 13 },

  inputGroup:         { marginBottom: 16 },
  label:              { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  inputBox:           { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14 },
  inputIcon:          { marginRight: 10 },
  input:              { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 14 },

  // Bouton principal
  btn:                { borderRadius: 16, marginTop: 8, overflow: "hidden",
                        shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  btnInner:           { backgroundColor: "#FF6B35", paddingVertical: 16, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                        borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  btnText:            { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  // Séparateur "ou"
  dividerRow:         { flexDirection: "row", alignItems: "center", marginVertical: 18, gap: 12 },
  dividerLine:        { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText:        { color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },

  // Bouton Google
  btnGoogle:          { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 14,
                        backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  btnGoogleText:      { color: "#333", fontWeight: "700", fontSize: 15 },

  // Lien secondaire sobre
  linkRow:            { marginTop: 20, alignItems: "center" },
  linkText:           { color: "rgba(255,255,255,0.45)", fontSize: 14 },
  linkHighlight:      { color: "#FF6B35", fontWeight: "700" },
});
