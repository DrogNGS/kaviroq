import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSocket } from "../services/socket";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

interface Message {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const { businessName, roomId } = useLocalSearchParams<{
    businessName: string;
    roomId: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // ✅ Garder userId dans un ref pour l'utiliser dans les callbacks socket
  const userIdRef = useRef<string>("");
  const userNameRef = useRef<string>("");

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { router.replace("/login"); return; }

      const userJson = await AsyncStorage.getItem("kaviroq_user");
      let currentUserId = "";
      if (userJson) {
        const user = JSON.parse(userJson);
        currentUserId = user.id || user._id;
        setUserId(currentUserId);
        setUserName(user.name);
        userIdRef.current = currentUserId;
        userNameRef.current = user.name;
      }

      // Charger l'historique depuis MongoDB
      try {
        const res = await fetch(`${API_URL}/api/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data.map((m: any) => ({
            id: m._id,
            sender: m.senderId,
            senderName: m.senderName,
            text: m.content,
            timestamp: m.createdAt,
            isOwn: m.senderId === currentUserId,
          })));
        }
      } catch (err) {
        console.error("Erreur historique:", err);
      }

      const socket = getSocket();

      const joinRoom = () => {
        socket.emit("join_room", roomId);
        setLoading(false);
      };

      if (socket.connected) {
        joinRoom();
      } else {
        socket.on("connect", joinRoom);
      }

      // ✅ FIX : Ne pas ajouter localement, laisser le socket gérer TOUS les messages
      socket.on("receive_message", (data: any) => {
        const msg: Message = {
          id: data.id ?? data._id ?? Math.random().toString(),
          sender: data.sender,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp ?? new Date().toISOString(),
          isOwn: data.sender === userIdRef.current,
        };
        setMessages(prev => {
          // Éviter les doublons par id
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });

      socket.on("connect_error", () => setLoading(false));
    };

    init();

    return () => {
      const socket = getSocket();
      socket.off("receive_message");
      socket.off("connect");
    };
  }, [roomId]);

  const sendMessage = async () => {
    if (!input.trim() || !userIdRef.current) return;
    setSending(true);
    const text = input.trim();
    setInput("");

    try {
      const socket = getSocket();
      // ✅ FIX : Envoyer seulement via socket, NE PAS ajouter localement
      // Le serveur va sauvegarder et renvoyer via receive_message à tout le monde y compris l'expéditeur
      socket.emit("send_message", {
        roomId,
        sender: userIdRef.current,
        senderName: userNameRef.current || "Utilisateur",
        text,
        timestamp: new Date().toISOString(),
      });
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le message");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Connexion au chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{businessName || "Chat"}</Text>
          <Text style={styles.headerSub}>En ligne</Text>
        </View>
        <Text style={styles.headerEmoji}>💬</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Démarrez la conversation</Text>
            <Text style={styles.emptyHint}>Envoyez un message à {businessName}</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
              <View style={[styles.messageBubble, msg.isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                {!msg.isOwn && <Text style={styles.senderName}>{msg.senderName}</Text>}
                <Text style={[styles.messageText, msg.isOwn ? styles.textOwn : styles.textOther]}>{msg.text}</Text>
                <Text style={[styles.timestamp, msg.isOwn ? styles.tsOwn : styles.tsOther]}>{formatTime(msg.timestamp)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Zone de saisie */}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Écrivez un message..."
          placeholderTextColor="#bbb"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendIcon}>➤</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#f5f5f5" },
  centered:        { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText:     { marginTop: 12, color: "#666" },
  header:          { backgroundColor: "#FF6B35", padding: 15, paddingTop: 50, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:         { padding: 4 },
  backText:        { color: "#fff", fontSize: 22 },
  headerTitle:     { color: "#fff", fontSize: 16, fontWeight: "bold" },
  headerSub:       { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  headerEmoji:     { fontSize: 24 },
  messages:        { flex: 1 },
  messagesContent: { padding: 15, paddingBottom: 20 },
  emptyBox:        { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyEmoji:      { fontSize: 50 },
  emptyText:       { color: "#999", fontSize: 15, fontWeight: "500" },
  emptyHint:       { color: "#bbb", fontSize: 13 },
  messageRow:      { marginBottom: 12, flexDirection: "row" },
  messageRowOwn:   { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  messageBubble:   { maxWidth: "75%", borderRadius: 16, padding: 12 },
  bubbleOwn:       { backgroundColor: "#FF6B35", borderBottomRightRadius: 4 },
  bubbleOther:     { backgroundColor: "#fff", elevation: 1, borderBottomLeftRadius: 4 },
  senderName:      { fontSize: 11, color: "#999", marginBottom: 4 },
  messageText:     { fontSize: 15, lineHeight: 20 },
  textOwn:         { color: "#fff" },
  textOther:       { color: "#333" },
  timestamp:       { fontSize: 10, marginTop: 4, textAlign: "right" },
  tsOwn:           { color: "rgba(255,255,255,0.7)" },
  tsOther:         { color: "#bbb" },
  inputBox:        { flexDirection: "row", padding: 12, backgroundColor: "#fff", gap: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  input:           { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, backgroundColor: "#fafafa" },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FF6B35", alignItems: "center", justifyContent: "center" },
  sendIcon:        { color: "#fff", fontSize: 18 },
});
