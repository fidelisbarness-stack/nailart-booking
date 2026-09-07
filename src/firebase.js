// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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