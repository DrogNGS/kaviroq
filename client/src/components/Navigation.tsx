import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Alert, Image
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";

interface NavigationProps {
  cartCount?: number;
}

export default function Navigation({ cartCount = 0 }: NavigationProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null); // ✅ Photo de profil

  React.useEffect(() => {
    const loadUser = async () => {
      const userJson = await AsyncStorage.getItem("kaviroq_user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserName(user.name);
        setUserRole(user.role);
        setUserAvatar(user.avatar ?? user.profileImage ?? user.photo ?? null); // ✅ Supporte plusieurs noms de champ
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["kaviroq_token", "kaviroq_user"]);
          setMenuOpen(false);
          router.replace("/login");
        }
      }
    ]);
  };

  const menuItems = [
    { icon: "🏠", label: "Accueil",         onPress: () => { setMenuOpen(false); router.push("/home"); } },
    { icon: "📋", label: "Mes commandes",   onPress: () => { setMenuOpen(false); router.push("/history"); } },
    { icon: "👤", label: "Mon profil",      onPress: () => { setMenuOpen(false); router.push("/profile"); } },
    { icon: "🔔", label: "Notifications",   onPress: () => { setMenuOpen(false); router.push("/notifications"); } },
    { icon: "⚙️", label: "Tableau de bord", onPress: () => { setMenuOpen(false); router.push("/admin"); }, show: userRole === "business" },
    { icon: "💬", label: "Messages",        onPress: () => { setMenuOpen(false); router.push({ pathname: "/chat", params: { businessName: "Support", roomId: "support_1" } }); } },
    { icon: "🚪", label: "Déconnexion",     onPress: handleLogout, danger: true },
  ];

  // ✅ Composant Avatar réutilisable (photo ou initiale)
  const Avatar = ({ size = 34, fontSize = 14, style = {} }: { size?: number; fontSize?: number; style?: any }) => {
    const borderRadius = size / 2;
    if (userAvatar) {
      return (
        <Image
          source={{ uri: userAvatar }}
          style={[{
            width: size, height: size, borderRadius,
            borderWidth: 1.5, borderColor: theme.primary
          }, style]}
        />
      );
    }
    return (
      <View style={[{
        width: size, height: size, borderRadius,
        backgroundColor: "rgba(255,107,53,0.3)",
        borderWidth: 1.5, borderColor: theme.primary,
        alignItems: "center", justifyContent: "center"
      }, style]}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize }}>
          {userName ? userName[0].toUpperCase() : "?"}
        </Text>
      </View>
    );
  };

  return (
    <>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
          <View style={styles.hamburger}>
            <View style={styles.hLine} />
            <View style={[styles.hLine, { width: 18 }]} />
            <View style={styles.hLine} />
          </View>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🚀</Text>
          <Text style={styles.logo}>KAVIROQ</Text>
        </View>

        <View style={styles.rightIcons}>
          <TouchableOpacity onPress={() => router.push("/history")} style={styles.iconBtn}>
            <Text style={styles.icon}>📋</Text>
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ✅ Avatar avec vraie photo */}
          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn}>
            <Avatar size={34} fontSize={14} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu latéral */}
      <Modal visible={menuOpen} animationType="slide" transparent onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.drawer}>

            {/* Header drawer avec grande photo */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerCircle} />

              {/* ✅ Grande photo dans le drawer */}
              <Avatar size={70} fontSize={28} />

              <Text style={styles.drawerName}>{userName ?? "Utilisateur"}</Text>
              <View style={[styles.drawerRolePill, { backgroundColor: userRole === "business" ? "rgba(255,107,53,0.2)" : "rgba(108,63,197,0.2)" }]}>
                <Text style={[styles.drawerRoleText, { color: userRole === "business" ? theme.primary : theme.accent }]}>
                  {userRole === "business" ? "🏪 Restaurateur" : "🙋 Client"}
                </Text>
              </View>

              {/* ✅ Bouton modifier la photo */}
              <TouchableOpacity
                style={styles.editPhotoBtn}
                onPress={() => { setMenuOpen(false); router.push("/profile"); }}
              >
                <Text style={styles.editPhotoText}>📷 Modifier la photo</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Items */}
            <ScrollView contentContainerStyle={styles.menuItems}>
              {menuItems
                .filter(item => item.show !== false)
                .map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.menuItem, (item as any).danger && styles.menuItemDanger]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.menuItemIconBox, (item as any).danger && styles.menuItemIconDanger]}>
                      <Text style={styles.menuItemIcon}>{item.icon}</Text>
                    </View>
                    <Text style={[styles.menuItemLabel, (item as any).danger && styles.menuItemLabelDanger]}>
                      {item.label}
                    </Text>
                    <Text style={styles.menuItemArrow}>›</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <Text style={styles.footerText}>v1.0.0 © Kaviroq 2024</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navbar:             { backgroundColor: theme.secondary, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", elevation: 8, overflow: "hidden" },
  circle1:            { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", top: -30, right: 60 },
  circle2:            { position: "absolute", width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,107,53,0.15)", bottom: -20, left: 100 },
  menuBtn:            { padding: 8 },
  hamburger:          { gap: 5 },
  hLine:              { width: 22, height: 2, backgroundColor: "#fff", borderRadius: 2 },
  logoBox:            { flexDirection: "row", alignItems: "center", gap: 6 },
  logoIcon:           { fontSize: 18 },
  logo:               { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  rightIcons:         { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn:            { padding: 6, position: "relative" },
  icon:               { fontSize: 20 },
  badge:              { position: "absolute", top: 0, right: 0, backgroundColor: theme.primary, borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center" },
  badgeText:          { color: "#fff", fontWeight: "bold", fontSize: 10 },
  modalOverlay:       { flex: 1, flexDirection: "row" },
  drawer:             { width: "75%", backgroundColor: theme.darker, height: "100%" },
  drawerHeader:       { backgroundColor: theme.secondary, padding: 24, paddingTop: 50, alignItems: "center", gap: 10, overflow: "hidden", position: "relative" },
  drawerCircle:       { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.05)", top: -50, right: -30 },
  drawerName:         { color: "#fff", fontSize: 16, fontWeight: "700" },
  drawerRolePill:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  drawerRoleText:     { fontSize: 12, fontWeight: "600" },
  // ✅ Bouton modifier photo
  editPhotoBtn:       { marginTop: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  editPhotoText:      { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  closeBtn:           { position: "absolute", top: 50, right: 16, padding: 8 },
  closeBtnText:       { color: "rgba(255,255,255,0.7)", fontSize: 20 },
  menuItems:          { padding: 12 },
  menuItem:           { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 4, gap: 12 },
  menuItemDanger:     { backgroundColor: "rgba(239,68,68,0.1)" },
  menuItemIconBox:    { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  menuItemIconDanger: { backgroundColor: "rgba(239,68,68,0.15)" },
  menuItemIcon:       { fontSize: 18 },
  menuItemLabel:      { flex: 1, fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  menuItemLabelDanger:{ color: "#FCA5A5" },
  menuItemArrow:      { color: "rgba(255,255,255,0.3)", fontSize: 20 },
  drawerFooter:       { padding: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  footerText:         { fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" },
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
});
