// app/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAw1f-pELAWnc4vchpdhh-zLJXtWTNBb7o",
  authDomain: "blaulicht-report-coc.firebaseapp.com",
  projectId: "blaulicht-report-coc",
  storageBucket: "blaulicht-report-coc.firebasestorage.app",
  messagingSenderId: "498650411681",
  appId: "1:498650411681:web:16a813f91a5defdb8d76e0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);