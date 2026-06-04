import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../store/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setMessage("Remplis tous les champs !"); return; }
    setLoading(true);
    setMessage("");
    try {
      await login({ email, password });
      setTimeout(async () => {
        const userJson = await AsyncStorage.getItem("kaviroq_user");
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user.role === "business") {
            router.replace("/dashboard");
          } else {
            router.replace("/home");
          }
        } else {
          router.replace("/home");
        }
      }, 100);
    } catch (e: any) {
      setMessage(e.message ?? "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.logoBox}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🚀</Text>
          </View>
          <Text style={styles.logo}>KAVIROQ</Text>
          <Text style={styles.tagline}>Bon retour parmi nous !</Text>
        </View>
        <View style={styles.form}>
          {message ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {message}</Text>
            </View>
          ) : null}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor={theme.textLight}
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
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Se connecter →</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBox} onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>
              Pas de compte ? <Text style={styles.link}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: theme.dark },
  content:     { flexGrow: 1, padding: 24, paddingTop: 60, position: "relative" },
  circle1:     { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(108,63,197,0.2)", top: -50, right: -50 },
  circle2:     { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,107,53,0.1)", bottom: 100, left: -50 },
  logoBox:     { alignItems: "center", marginBottom: 40, marginTop: 20 },
  logoIcon:    { width: 70, height: 70, borderRadius: 20, backgroundColor: "rgba(255,107,53,0.15)", borderWidth: 1.5, borderColor: "rgba(255,107,53,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoEmoji:   { fontSize: 32 },
  logo:        { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: 4 },
  tagline:     { fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 6 },
  form:        { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  errorBox:    { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorText:   { color: "#FCA5A5", fontSize: 13 },
  inputGroup:  { marginBottom: 16 },
  label:       { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  inputBox:    { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14 },
  inputIcon:   { fontSize: 16, marginRight: 10 },
  input:       { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 14 },
  btn:         { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnText:     { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBox:     { alignItems: "center", marginTop: 16 },
  linkText:    { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  link:        { color: theme.primary, fontWeight: "600" },
});
