import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, RefreshControl
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

interface Conversation {
  _id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  businessName?: string;
}

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadConversations = async () => {
    try {
      const token = await AsyncStorage.getItem("kaviroq_token");
      const res = await fetch(`${API_URL}/api/messages/conversations/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch (err) {
      console.error("Erreur conversations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const openChat = (conv: Conversation) => {
    router.push({
      pathname: "/chat",
      params: {
        roomId: conv._id,
        businessName: conv.businessName || "Entreprise",
      }
    });
  };

  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      if (days === 1) return "Hier";
      if (days < 7) return date.toLocaleDateString("fr-FR", { weekday: "short" });
      return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    } catch { return ""; }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>Aucune conversation</Text>
          <Text style={styles.emptyHint}>Contactez un restaurant ou une entreprise !</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadConversations(); }}
              colors={["#FF6B35"]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openChat(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.businessName?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.businessName || item._id}
                  </Text>
                  <Text style={styles.time}>{formatDate(item.lastMessageAt)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#f5f5f5" },
  header:       { backgroundColor: "#FF6B35", padding: 16, paddingTop: 50 },
  headerTitle:  { color: "#fff", fontSize: 22, fontWeight: "bold" },
  card: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 12, padding: 14, marginBottom: 10,
    elevation: 2, alignItems: "center",
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#FF6B35", alignItems: "center",
    justifyContent: "center", marginRight: 12,
  },
  avatarText:   { color: "#fff", fontSize: 20, fontWeight: "bold" },
  info:         { flex: 1 },
  row:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name:         { fontSize: 16, fontWeight: "bold", color: "#1a1a1a", flex: 1, marginRight: 8 },
  time:         { fontSize: 12, color: "#999" },
  lastMessage:  { fontSize: 14, color: "#666", flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: "#FF6B35", borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 5,
  },
  badgeText:    { color: "#fff", fontSize: 11, fontWeight: "bold" },
  center:       { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyEmoji:   { fontSize: 60, marginBottom: 16 },
  emptyText:    { fontSize: 18, fontWeight: "bold", color: "#333" },
  emptyHint:    { fontSize: 14, color: "#999", marginTop: 8, textAlign: "center" },
});