"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
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

async function ensureUserDocument(firebaseUser: User) {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) return;

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
    avatarDataUrl: "",
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, fallbackUser);
  await setDoc(doc(db, "usernames", fallbackUser.username), {
    uid: firebaseUser.uid,
    createdAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUserData() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUserData(null);
      return;
    }

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    setUserData(userSnap.exists() ? (userSnap.data() as AppUser) : null);
  }

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeUserDoc?.();
      unsubscribeUserDoc = undefined;
      setLoading(true);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        await ensureUserDocument(firebaseUser);
        unsubscribeUserDoc = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            setUserData(snap.exists() ? (snap.data() as AppUser) : null);
            setLoading(false);
          },
          () => {
            setUserData(null);
            setLoading(false);
          },
        );
      } catch {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeUserDoc?.();
      unsubAuth();
    };
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
