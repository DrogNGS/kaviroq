import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

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

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const uid = await AsyncStorage.getItem("kaviroq_user");
      const uname = await AsyncStorage.getItem("kaviroq_user");
      setUserId(uid);
      setUserName(uname);

      const token = await AsyncStorage.getItem("kaviroq_token");
      if (!token) { router.replace("/login"); return; }

      const socket = io(API_URL, {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join_room", roomId);
        setLoading(false);
      });

      socket.on("receive_message", (data: any) => {
        const msg: Message = {
          id: data.id ?? Math.random().toString(),
          sender: data.sender,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp ?? new Date().toISOString(),
          isOwn: data.sender === uid,
        };
        setMessages(prev => [...prev, msg]);
      });

      socket.on("connect_error", () => {
        Alert.alert("Erreur", "Impossible de se connecter au chat");
        setLoading(false);
      });
    };

    init();
    return () => { socketRef.current?.disconnect(); };
  }, [roomId]);

  const sendMessage = async () => {
    if (!input.trim() || !userId || !socketRef.current) return;

    setSending(true);
    const text = input.trim();
    setInput("");

    try {
      socketRef.current.emit("send_message", {
        roomId,
        sender: userId,
        senderName: userName ?? "Utilisateur",
        text,
      });
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le message");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>â†</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ðŸ’¬ Chat</Text>
          <Text style={styles.headerSub}>{businessName ?? "Restaurant"}</Text>
        </View>
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
            <Text style={styles.emptyEmoji}>ðŸ’­</Text>
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            <Text style={styles.emptyHint}>Ã‰crivez un message pour commencer</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.isOwn ? styles.messageRowOwn : styles.messageRowOther,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.isOwn ? styles.bubbleOwn : styles.bubbleOther,
                ]}
              >
                {!msg.isOwn && (
                  <Text style={styles.senderName}>{msg.senderName}</Text>
                )}
                <Text style={[styles.messageText, msg.isOwn ? styles.textOwn : styles.textOther]}>
                  {msg.text}
                </Text>
                <Text style={[styles.timestamp, msg.isOwn ? styles.tsOwn : styles.tsOther]}>
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Ã‰crivez un message..."
          placeholderTextColor="var(--color-text-tertiary)"
          value={input}
          onChangeText={setInput}
          editable={!sending}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.6 }]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendIcon}>âœˆï¸</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#f5f5f5" },
  centered:       { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText:    { marginTop: 12, color: "#666" },
  header:         { backgroundColor: "#FF6B35", padding: 15, paddingTop: 50, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:        { padding: 4 },
  backText:       { color: "#fff", fontSize: 22 },
  headerTitle:    { color: "#fff", fontSize: 16, fontWeight: "bold" },
  headerSub:      { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  messages:       { flex: 1 },
  messagesContent: { padding: 15, paddingBottom: 20 },
  emptyBox:       { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyEmoji:     { fontSize: 50 },
  emptyText:      { color: "#999", fontSize: 15, fontWeight: "500" },
  emptyHint:      { color: "#bbb", fontSize: 13 },
  messageRow:     { marginBottom: 12, flexDirection: "row" },
  messageRowOwn:  { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  messageBubble:  { maxWidth: "75%", borderRadius: 12, padding: 12, gap: 4 },
  bubbleOwn:      { backgroundColor: "#FF6B35" },
  bubbleOther:    { backgroundColor: "#fff", elevation: 1 },
  senderName:     { fontSize: 11, color: "#999", marginBottom: 2 },
  messageText:    { fontSize: 15, lineHeight: 20 },
  textOwn:        { color: "#fff" },
  textOther:      { color: "#333" },
  timestamp:      { fontSize: 11, marginTop: 4 },
  tsOwn:          { color: "rgba(255,255,255,0.7)" },
  tsOther:        { color: "#bbb" },
  inputBox:       { flexDirection: "row", padding: 12, backgroundColor: "#fff", gap: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  input:          { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FF6B35", alignItems: "center", justifyContent: "center" },
  sendIcon:       { fontSize: 20 },
});
