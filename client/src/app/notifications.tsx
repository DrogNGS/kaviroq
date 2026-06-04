import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";

interface Notification {
  id: string;
  type: "order" | "promo" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "order",  title: "Commande confirmée",     message: "Votre commande #951195 a été confirmée par Restaurant Le Plateau.", time: "Il y a 5 min",  read: false },
  { id: "2", type: "order",  title: "Livreur en route",       message: "Votre livreur est en chemin. Arrivée estimée dans 15 min.",          time: "Il y a 12 min", read: false },
  { id: "3", type: "promo",  title: "Offre spéciale 🎉",      message: "Obtenez 20% de réduction sur votre prochaine commande avec HUBIFY20.", time: "Il y a 1h",    read: true },
  { id: "4", type: "order",  title: "Commande livrée ✅",     message: "Votre commande a été livrée. Bon appétit !",                          time: "Hier",          read: true },
  { id: "5", type: "system", title: "Bienvenue sur Hubify !", message: "Découvrez les meilleurs restaurants près de chez vous.",              time: "Il y a 2 jours", read: true },
];

const TYPE_ICONS: Record<string, string> = {
  order:  "🛵",
  promo:  "🎁",
  system: "🔔",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  order:  { bg: "#E6F1FB", color: "#185FA5" },
  promo:  { bg: "#FFF0E6", color: "#993C1D" },
  system: { bg: "#EAF3DE", color: "#3B6D11" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllBtn}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptyText}>Vous êtes à jour !</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {notifications.map(notif => {
            const colors = TYPE_COLORS[notif.type];
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifUnread]}
                onPress={() => markRead(notif.id)}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
                  <Text style={styles.iconText}>{TYPE_ICONS[notif.type]}</Text>
                </View>

                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>
                    {notif.title}
                  </Text>
                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>

                <View style={styles.notifActions}>
                  {!notif.read && <View style={styles.unreadDot} />}
                  <TouchableOpacity onPress={() => deleteNotification(notif.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f5f5f5" },
  header:           { backgroundColor: "#FF6B35", padding: 15, paddingTop: 50, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:          { padding: 4 },
  backText:         { color: "#fff", fontSize: 22 },
  title:            { color: "#fff", fontSize: 20, fontWeight: "bold" },
  unreadCount:      { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  markAllBtn:       { color: "#fff", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  emptyBox:         { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyEmoji:       { fontSize: 60 },
  emptyTitle:       { fontSize: 20, fontWeight: "bold", color: "#333" },
  emptyText:        { fontSize: 14, color: "#999" },
  notifCard:        { backgroundColor: "#fff", margin: 8, marginHorizontal: 15, borderRadius: 12, padding: 15, flexDirection: "row", alignItems: "flex-start", gap: 12, elevation: 1 },
  notifUnread:      { backgroundColor: "#FFFAF7", borderLeftWidth: 3, borderLeftColor: "#FF6B35" },
  iconBox:          { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  iconText:         { fontSize: 20 },
  notifContent:     { flex: 1, gap: 4 },
  notifTitle:       { fontSize: 14, color: "#555", fontWeight: "500" },
  notifTitleUnread: { color: "#333", fontWeight: "700" },
  notifMessage:     { fontSize: 13, color: "#777", lineHeight: 18 },
  notifTime:        { fontSize: 11, color: "#bbb", marginTop: 2 },
  notifActions:     { alignItems: "center", gap: 8 },
  unreadDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B35" },
  deleteBtn:        { color: "#ccc", fontSize: 16, padding: 4 },
});