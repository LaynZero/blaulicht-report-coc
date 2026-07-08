"use client";

import { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { Bell, BellRing, KeyRound } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { db, getFirebaseMessaging } from "@/app/firebase";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export default function PushNotifications() {
  const { user, userData } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function listenForegroundMessages() {
      if (!vapidKey) return;
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || "Blaulicht Report COC";
        const body = payload.notification?.body || "Neue Meldung in der App";
        if (Notification.permission === "granted") new Notification(title, { body, icon: "/icon-192.png" });
      });
    }

    listenForegroundMessages();
    return () => unsubscribe?.();
  }, []);

  async function enablePush() {
    setMessage("");
    if (!user || !userData) return setMessage("Bitte zuerst einloggen.");
    if (!supported) return setMessage("Push-Benachrichtigungen werden auf diesem Gerät/Browser nicht unterstützt.");
    if (!vapidKey) {
      setMessage("Push ist vorbereitet. Trage zuerst den Web Push VAPID Key in .env.local ein und starte npm run dev neu.");
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setMessage("Benachrichtigungen wurden nicht erlaubt.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        setMessage("Firebase Messaging wird hier nicht unterstützt.");
        return;
      }

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) {
        setMessage("Es konnte kein Push-Token erstellt werden.");
        return;
      }

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
      setMessage("Push-Benachrichtigungen sind aktiviert. Für echten Versand muss zusätzlich FIREBASE_SERVICE_ACCOUNT_KEY bei Vercel gesetzt sein.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Push konnte nicht aktiviert werden.");
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
          <p className="mt-1 text-sm text-slate-400">Erhalte Hinweise bei neuen Meldungen, offiziellen Posts oder wichtigen Admin-Infos.</p>

          {!vapidKey && (
            <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-200">
              <div className="mb-1 flex items-center gap-2 font-black"><KeyRound size={15} /> Firebase VAPID Key fehlt</div>
              Firebase Console → Projekteinstellungen → Cloud Messaging → Web Push-Zertifikate. Den Schlüssel lokal in <b>.env.local</b> oder bei Vercel als <b>NEXT_PUBLIC_FIREBASE_VAPID_KEY</b> eintragen und danach neu starten/deployen.
            </div>
          )}

          <button
            type="button"
            onClick={enablePush}
            disabled={loading || permission === "denied" || !supported}
            className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? "Wird aktiviert..." : permission === "granted" ? "Push erneut verbinden" : permission === "denied" ? "Im Browser blockiert" : "Push aktivieren"}
          </button>

          {message && <p className="mt-3 rounded-2xl bg-slate-950/50 p-3 text-xs text-slate-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}
