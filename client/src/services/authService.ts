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

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

// Synchroniser l utilisateur Firebase avec MongoDB
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

// Inscription email/password
export const register = async ({ name, email, password, role }: { name: string; email: string; password: string; role: string }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return await syncUserWithBackend(cred.user, role, name);
};

// Connexion email/password
export const login = async ({ email, password }: { email: string; password: string }) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return await syncUserWithBackend(cred.user);
};

// Connexion Google
export const loginWithGoogle = async (role?: string) => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return await syncUserWithBackend(cred.user, role);
};

// Déconnexion
export const logout = async () => {
  await signOut(auth);
  await AsyncStorage.multiRemove(["kaviroq_token", "kaviroq_user", "userRole"]);
};

// Restaurer session
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
