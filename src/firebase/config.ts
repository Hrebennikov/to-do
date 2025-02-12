import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGfXTqMkSpbq-d859sCNuQ1k_EGzZ0bXY",
  authDomain: "to-do-list-d662a.firebaseapp.com",
  projectId: "to-do-list-d662a",
  storageBucket: "to-do-list-d662a.firebasestorage.app",
  messagingSenderId: "28610516386",
  appId: "1:28610516386:web:406ce4c75731291ed98efb",
  measurementId: "G-SN6GJZB2T0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
