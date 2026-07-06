"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { Bell, BellRing } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { db, getFirebaseMessaging } from "@/app/firebase";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export default function PushNotifications() {
  const { user, userData } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function listenForegroundMessages() {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || "Blaulicht Report COC";
        const body = payload.notification?.body || "Neue Meldung in der App";
        if (Notification.permission === "granted") {
          new Notification(title, { body, icon: "/icon-192.png" });
        }
      });
    }

    listenForegroundMessages();
    return () => unsubscribe?.();
  }, []);

  async function enablePush() {
    if (!user || !userData) return alert("Bitte zuerst einloggen.");
    if (!supported) return alert("Push-Benachrichtigungen werden auf diesem Gerät/Browser nicht unterstützt.");
    if (!vapidKey) return alert("Es fehlt noch der Firebase Web Push VAPID Key. Lege ihn in .env.local als NEXT_PUBLIC_FIREBASE_VAPID_KEY ab.");

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return alert("Benachrichtigungen wurden nicht erlaubt.");

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const messaging = await getFirebaseMessaging();
      if (!messaging) return alert("Firebase Messaging wird hier nicht unterstützt.");

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) return alert("Es konnte kein Push-Token erstellt werden.");

      await setDoc(doc(db, "pushTokens", token), {
        token,
        uid: user.uid,
        displayName: userData.displayName,
        role: userData.role,
        userAgent: navigator.userAgent,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setEnabled(true);
      alert("Push-Benachrichtigungen sind aktiviert.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Push konnte nicht aktiviert werden.");
    } finally {
      setLoading(false);
    }
  }

  if (!userData) return null;

  return (
    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-600/30 p-3 text-blue-200">
          {enabled || permission === "granted" ? <BellRing size={22} /> : <Bell size={22} />}
        </div>
        <div className="flex-1">
          <p className="font-black">Push-Benachrichtigungen</p>
          <p className="mt-1 text-sm text-slate-400">
            Erhalte später Hinweise bei neuen Meldungen, offiziellen Posts oder wichtigen Admin-Infos.
          </p>
          <button
            type="button"
            onClick={enablePush}
            disabled={loading || permission === "denied"}
            className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? "Wird aktiviert..." : permission === "granted" ? "Push erneut verbinden" : permission === "denied" ? "Im Browser blockiert" : "Push aktivieren"}
          </button>
          {!vapidKey && (
            <p className="mt-3 text-xs text-amber-300">
              Hinweis: Für echte Push-Tokens brauchst du noch den Firebase Web Push VAPID Key in <b>.env.local</b>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
