import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB3K8B2keUu2sqpqb2Fp-NOw05vgC8aLRo",
  authDomain: "hisword-916b0.firebaseapp.com",
  projectId: "hisword-916b0",
  storageBucket: "hisword-916b0.firebasestorage.app",
  messagingSenderId: "698551280268",
  appId: "1:698551280268:web:a9cb26f7b1ecbe97cfd1a9",
  measurementId: "G-Z75XW2EXM9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
