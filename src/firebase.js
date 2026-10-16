// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 1. Tambahkan import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxPyT1tugbLAIEOAnDWTulOEvpiFDkWBI",
  authDomain: "livia-nailart-web.firebaseapp.com",
  projectId: "livia-nailart-web",
  storageBucket: "livia-nailart-web.firebasestorage.app",
  messagingSenderId: "140963782247",
  appId: "1:140963782247:web:192c69c3b2c5c442953ec2",
  measurementId: "G-YHYL17XG3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); 

// 2. Inisialisasi dan EXPORT 'db' agar bisa dipakai di Ulasan.jsx & Admin.jsx
export const db = getFirestore(app);