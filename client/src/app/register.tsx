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
      setMessage({ text: "Mot de passe trop court (6 caractÃ¨res min)", type: "error" }); return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await register({
        name,
        email,
        password,
        role: role === "business" ? "business" : "client",
      });
      setMessage({ text: "Compte crÃ©Ã© avec succÃ¨s !", type: "success" });
      setTimeout(() => {
  if (role === "business") {
    router.replace("/dashboard");
  } else {
    router.replace("/home");
  }
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

        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.logoBox}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>ðŸš€</Text>
          </View>
          <Text style={styles.logo}>KAVIROQ</Text>
          <Text style={styles.tagline}>CrÃ©ez votre compte gratuitement</Text>
        </View>

        <View style={styles.form}>
          {message && (
            <View style={[styles.msgBox, message.type === "error" ? styles.msgError : styles.msgSuccess]}>
              <Text style={[styles.msgText, message.type === "error" ? styles.msgTextError : styles.msgTextSuccess]}>
                {message.type === "error" ? "âš ï¸ " : "âœ… "}{message.text}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>ðŸ‘¤</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean Kouassi"
                placeholderTextColor={theme.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>ðŸ“§</Text>
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
              <Text style={styles.inputIcon}>ðŸ”’</Text>
              <TextInput
                style={styles.input}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                placeholderTextColor={theme.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={[styles.inputBox, confirm && password !== confirm && styles.inputError]}>
              <Text style={styles.inputIcon}>ðŸ”’</Text>
              <TextInput
                style={styles.input}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                placeholderTextColor={theme.textLight}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Je suis</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === "client" && styles.roleBtnActive]}
                onPress={() => setRole("client")}
              >
                <Text style={styles.roleEmoji}>ðŸ™‹</Text>
                <Text style={[styles.roleText, role === "client" && styles.roleTextActive]}>Client</Text>
                <Text style={styles.roleDesc}>Je commande</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === "business" && styles.roleBtnActive]}
                onPress={() => setRole("business")}
              >
                <Text style={styles.roleEmoji}>ðŸª</Text>
                <Text style={[styles.roleText, role === "business" && styles.roleTextActive]}>Entreprise</Text>
                <Text style={styles.roleDesc}>Je vends</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>CrÃ©er mon compte â†’</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBox} onPress={() => router.push("/login")}>
            <Text style={styles.linkText}>
              DÃ©jÃ  un compte ? <Text style={styles.link}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.dark },
  content:        { flexGrow: 1, padding: 24, paddingTop: 60 },
  circle1:        { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(108,63,197,0.2)", top: -50, right: -50 },
  circle2:        { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,107,53,0.1)", bottom: 100, left: -50 },
  logoBox:        { alignItems: "center", marginBottom: 30, marginTop: 10 },
  logoIcon:       { width: 64, height: 64, borderRadius: 18, backgroundColor: "rgba(255,107,53,0.15)", borderWidth: 1.5, borderColor: "rgba(255,107,53,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoEmoji:      { fontSize: 28 },
  logo:           { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 4 },
  tagline:        { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 },
  form:           { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  msgBox:         { borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  msgError:       { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)" },
  msgSuccess:     { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.3)" },
  msgText:        { fontSize: 13 },
  msgTextError:   { color: "#FCA5A5" },
  msgTextSuccess: { color: "#6EE7B7" },
  inputGroup:     { marginBottom: 14 },
  label:          { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  inputBox:       { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14 },
  inputError:     { borderColor: "rgba(239,68,68,0.5)" },
  inputIcon:      { fontSize: 16, marginRight: 10 },
  input:          { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 14 },
  roleRow:        { flexDirection: "row", gap: 12 },
  roleBtn:        { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", gap: 4 },
  roleBtnActive:  { borderColor: theme.primary, backgroundColor: "rgba(255,107,53,0.15)" },
  roleEmoji:      { fontSize: 24 },
  roleText:       { color: "rgba(255,255,255,0.6)", fontWeight: "600", fontSize: 13 },
  roleTextActive: { color: theme.primary },
  roleDesc:       { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  btn:            { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btnText:        { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBox:        { alignItems: "center", marginTop: 16 },
  linkText:       { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  link:           { color: theme.primary, fontWeight: "600" },
});
