import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyAw1f-pELAWnc4vchpdhh-zLJXtWTNBb7o",
  authDomain: "blaulicht-report-coc.firebaseapp.com",
  projectId: "blaulicht-report-coc",
  storageBucket: "blaulicht-report-coc.firebasestorage.app",
  messagingSenderId: "498650411681",
  appId: "1:498650411681:web:16a813f91a5defdb8d76e0",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export default app;
