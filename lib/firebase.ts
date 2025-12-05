// src/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Option A: paste config directly (not recommended for public repos)
const firebaseConfig = {
  apiKey: "AIzaSyCKMhDqiPvaYn7KMVxk_YIjp8IdBQ0dRBE",
  authDomain: "bytedocker-64803.firebaseapp.com",
  databaseURL: "https://bytedocker-64803-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bytedocker-64803",
  storageBucket: "bytedocker-64803.firebasestorage.app",
  messagingSenderId: "343413923173",
  appId: "1:343413923173:web:47c2712cf51cfc355cd58c",
  measurementId: "G-9TSEQTM392"
};

const app: FirebaseApp = initializeApp(firebaseConfig);

// Exports — use these in your app
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
