import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../theme";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function AppHeader({ title, subtitle, showBack = true, rightElement }: AppHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* Décorations cercles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightElement && <View>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header:   {
    backgroundColor: theme.secondary,
    padding: 15,
    paddingTop: 50,
    paddingBottom: 20,
    overflow: "hidden",
  },
  circle1:  {
    position: "absolute",
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -30, right: -20,
  },
  circle2:  {
    position: "absolute",
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,107,53,0.15)",
    bottom: -20, left: 30,
  },
  row:      { flexDirection: "row", alignItems: "center", gap: 12, zIndex: 1 },
  backBtn:  { padding: 4 },
  backText: { color: "#fff", fontSize: 22 },
  title:    { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 0.3 },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
});