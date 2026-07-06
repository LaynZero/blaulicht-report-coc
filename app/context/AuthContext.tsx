"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { AppUser } from "@/lib/types";

export type AuthContextType = {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(firebaseUser: User | null) {
    if (!firebaseUser) {
      setUserData(null);
      return;
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUserData(userSnap.data() as AppUser);
      return;
    }

    const fallbackUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? "Neues Mitglied",
      username: `user_${firebaseUser.uid.slice(0, 6)}`,
      role: "user",
      trustPoints: 0,
      reportsCount: 0,
      confirmationsCount: 0,
      commentsCount: 0,
      banned: false,
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, fallbackUser);
    setUserData(fallbackUser);
  }

  async function refreshUserData() {
    await loadUserData(auth.currentUser);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      await loadUserData(firebaseUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
