import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCY1-Xnn_yH8FIOFKTvetUiXaAOJvY1eKo",
  authDomain: "kaviroq-2585b.firebaseapp.com",
  projectId: "kaviroq-2585b",
  storageBucket: "kaviroq-2585b.firebasestorage.app",
  messagingSenderId: "651491972985",
  appId: "1:651491972985:web:602ab909909e4c890541a8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;