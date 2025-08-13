// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2iNXj8zMD3t9hnwbItI3PiRUcw8S3mI8",
  authDomain: "akran-6891f.firebaseapp.com",
  projectId: "akran-6891f",
  storageBucket: "akran-6891f.firebasestorage.app",
  messagingSenderId: "252187049082",
  appId: "1:252187049082:web:12cd830531019932b58fc3",
  measurementId: "G-SMGPPD416P"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// HATA: Dosyanın sonundaki fazladan '}' karakteri kaldırıldı.