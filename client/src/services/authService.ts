import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

const syncUserWithBackend = async (firebaseUser: FirebaseUser, role?: string, name?: string) => {
  const idToken = await firebaseUser.getIdToken();
  const res = await fetch(`${API_URL}/api/auth/firebase-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: name || firebaseUser.displayName || "Utilisateur",
      role: role || "client",
      idToken,
    }),
  });
  if (!res.ok) throw new Error("Erreur synchronisation backend");
  const data = await res.json();
  await AsyncStorage.setItem("kaviroq_token", data.token);
  await AsyncStorage.setItem("kaviroq_user", JSON.stringify(data.user));
  return data;
};

export const register = async ({ name, email, password, role }: { name: string; email: string; password: string; role: string }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return await syncUserWithBackend(cred.user, role, name);
};

export const login = async ({ email, password }: { email: string; password: string }) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return await syncUserWithBackend(cred.user);
};

export const loginWithGoogle = async (role?: string) => {
  if (Platform.OS === "web") {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return await syncUserWithBackend(cred.user, role);
  } else {
    // Mobile : expo-auth-session
    const { makeRedirectUri } = require("expo-auth-session");
    const { exchangeCodeAsync } = require("expo-auth-session");
    const WebBrowser = require("expo-web-browser");
    const { GoogleAuthProvider: GAP, signInWithCredential } = require("firebase/auth");

    WebBrowser.maybeCompleteAuthSession();

    const redirectUri = makeRedirectUri({ scheme: "kaviroq" });
    const clientId = "651491972985-ci6tics9dggvdkhjmdij6pjdpliv2pq8.apps.googleusercontent.com";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success") throw new Error("Connexion Google annulée");

    const { code } = result;
    const tokenResponse = await exchangeCodeAsync(
      { code, redirectUri, clientId, extraParams: { grant_type: "authorization_code" } },
      { tokenEndpoint: "https://oauth2.googleapis.com/token" }
    );

    const credential = GAP.credential(tokenResponse.idToken);
    const cred = await signInWithCredential(auth, credential);
    return await syncUserWithBackend(cred.user, role);
  }
};

export const logout = async () => {
  await signOut(auth);
  await AsyncStorage.multiRemove(["kaviroq_token", "kaviroq_user", "userRole"]);
};

export const restoreSession = async () => {
  try {
    const token = await AsyncStorage.getItem("kaviroq_token");
    const userJson = await AsyncStorage.getItem("kaviroq_user");
    if (!token || !userJson) return null;
    return { token, user: JSON.parse(userJson) };
  } catch {
    return null;
  }
};
