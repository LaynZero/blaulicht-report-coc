"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { getDeviceId } from "@/lib/deviceId";

export type AuthContextType = {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
  deviceBanned: boolean;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  deviceBanned: false,
  refreshUserData: async () => undefined,
});

async function ensureUserDocument(firebaseUser: User, deviceId: string) {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    if (deviceId) {
      // Best-effort: record this device against the account for future device-ban lookups.
      // Never blocks sign-in if it fails (e.g. offline).
      updateDoc(userRef, { deviceIds: arrayUnion(deviceId) }).catch(() => undefined);
    }
    return;
  }

  const fallbackUser: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName ?? "Neues Mitglied",
    displayNameLower: (firebaseUser.displayName ?? "Neues Mitglied").toLowerCase(),
    username: `user_${firebaseUser.uid.slice(0, 6)}`,
    role: "user",
    trustPoints: 0,
    reportsCount: 0,
    confirmationsCount: 0,
    commentsCount: 0,
    banned: false,
    avatarDataUrl: "",
    deviceIds: deviceId ? [deviceId] : [],
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, fallbackUser);
  await setDoc(doc(db, "usernames", fallbackUser.username), {
    uid: firebaseUser.uid,
    createdAt: serverTimestamp(),
  });
}

async function checkDeviceBanned(deviceId: string): Promise<boolean> {
  if (!deviceId) return false;
  try {
    const response = await fetch("/api/auth/device-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    const data = await response.json();
    return Boolean(data?.banned);
  } catch {
    // Network/API hiccup: fail open rather than locking everyone out on a transient error.
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceBanned, setDeviceBanned] = useState(false);

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

      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      const deviceId = getDeviceId();
      const banned = await checkDeviceBanned(deviceId);
      if (banned) {
        setDeviceBanned(true);
        await signOut(auth);
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }
      setDeviceBanned(false);

      setUser(firebaseUser);

      try {
        await ensureUserDocument(firebaseUser, deviceId);
        unsubscribeUserDoc = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            const nextUserData = snap.exists() ? (snap.data() as AppUser) : null;
            if (nextUserData?.deviceBanned) {
              setDeviceBanned(true);
              setUserData(null);
              setUser(null);
              setLoading(false);
              signOut(auth).catch(() => undefined);
              return;
            }
            setUserData(nextUserData);
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
    <AuthContext.Provider value={{ user, userData, loading, deviceBanned, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
