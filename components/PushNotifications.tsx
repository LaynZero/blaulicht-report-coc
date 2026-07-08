"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { Bell, BellRing, KeyRound, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { db, getFirebaseMessaging } from "@/app/firebase";
import { reportCategories } from "@/lib/helpers";
import type { ReportCategory } from "@/lib/types";

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export default function PushNotifications() {
  const { user, userData } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>([]);
  const [officialEnabled, setOfficialEnabled] = useState(true);
  const [emergencyEnabled, setEmergencyEnabled] = useState(true);
  const [mentionsEnabled, setMentionsEnabled] = useState(true);

  useEffect(() => {
    if (!userData) return;
    setSelectedCategories(userData.notificationCategories?.length ? userData.notificationCategories : reportCategories.map((item) => item.value));
    setOfficialEnabled(userData.notificationOfficial ?? true);
    setEmergencyEnabled(userData.notificationEmergency ?? true);
    setMentionsEnabled(userData.notificationMentions ?? true);
  }, [userData]);

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
        if (Notification.permission === "granted") {
          const url = payload.data?.url || (payload.data?.reportId ? `/report/${payload.data.reportId}` : "/");
          const notification = new Notification(title, { body, icon: "/icon-192.png", data: { url } });
          notification.onclick = () => {
            window.focus();
            window.location.href = url;
            notification.close();
          };
        }
      });
    }
    listenForegroundMessages();
    return () => unsubscribe?.();
  }, []);

  function toggleCategory(value: ReportCategory) {
    setSelectedCategories((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function savePreferences() {
    if (!user || !userData) return;
    setSavingPrefs(true);
    try {
      const prefs = {
        notificationCategories: selectedCategories,
        notificationOfficial: officialEnabled,
        notificationEmergency: emergencyEnabled,
        notificationMentions: mentionsEnabled,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "users", user.uid), prefs);

      const tokensSnap = await getDocs(query(collection(db, "pushTokens"), where("uid", "==", user.uid)));
      await Promise.all(tokensSnap.docs.map((tokenDoc) => updateDoc(doc(db, "pushTokens", tokenDoc.id), {
        categories: selectedCategories,
        official: officialEnabled,
        emergency: emergencyEnabled,
        mentions: mentionsEnabled,
        updatedAt: serverTimestamp(),
      })));

      setMessage("Benachrichtigungsfilter gespeichert.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Filter konnten nicht gespeichert werden.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function enablePush() {
    setMessage("");
    if (!user || !userData) return setMessage("Bitte zuerst einloggen.");
    if (!supported) return setMessage("Push-Benachrichtigungen werden auf diesem Gerät/Browser nicht unterstützt.");
    if (!vapidKey) return setMessage("Push ist vorbereitet. Trage zuerst den Web Push VAPID Key in .env.local oder Vercel ein und starte neu.");

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return setMessage("Benachrichtigungen wurden nicht erlaubt.");

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const messaging = await getFirebaseMessaging();
      if (!messaging) return setMessage("Firebase Messaging wird hier nicht unterstützt.");

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) return setMessage("Es konnte kein Push-Token erstellt werden.");

      await setDoc(doc(db, "pushTokens", token), {
        token,
        uid: user.uid,
        displayName: userData.displayName,
        username: userData.username,
        role: userData.role,
        categories: selectedCategories,
        official: officialEnabled,
        emergency: emergencyEnabled,
        mentions: mentionsEnabled,
        userAgent: navigator.userAgent,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setEnabled(true);
      setMessage("Push-Benachrichtigungen sind aktiviert und verwenden deine Filter.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Push konnte nicht aktiviert werden.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestPush() {
    if (!user) return;
    setTesting(true);
    setMessage("");
    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Test-Push konnte nicht gesendet werden.");
      setMessage(data.sent > 0 ? "Test-Push wurde gesendet." : "Kein Push wurde gesendet. Prüfe Service Account und Token.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Test-Push konnte nicht gesendet werden.");
    } finally {
      setTesting(false);
    }
  }

  if (!userData) return null;

  return (
    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-600/30 p-3 text-blue-200">{enabled || permission === "granted" ? <BellRing size={22} /> : <Bell size={22} />}</div>
        <div className="flex-1">
          <p className="font-black">Push-Benachrichtigungen</p>
          <p className="mt-1 text-sm text-slate-400">Erhalte nur die Meldungen, die für dich wichtig sind.</p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center gap-2 font-black"><SlidersHorizontal size={17} /> Benachrichtigungsfilter</div>
            <div className="grid grid-cols-2 gap-2">
              {reportCategories.map((item) => (
                <label key={item.value} className="flex items-center gap-2 rounded-xl bg-slate-900 p-3 text-xs font-bold">
                  <input type="checkbox" checked={selectedCategories.includes(item.value)} onChange={() => toggleCategory(item.value)} /> {item.icon} {item.label}
                </label>
              ))}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={officialEnabled} onChange={(e) => setOfficialEnabled(e.target.checked)} /> Offizielle Admin/Entwickler-Posts</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={emergencyEnabled} onChange={(e) => setEmergencyEnabled(e.target.checked)} /> 🚨 Eilmeldungen immer erhalten</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={mentionsEnabled} onChange={(e) => setMentionsEnabled(e.target.checked)} /> Erwähnungen mit @username</label>
            </div>
            <button type="button" onClick={savePreferences} disabled={savingPrefs} className="mt-3 w-full rounded-2xl bg-slate-800 py-3 text-sm font-black disabled:opacity-60">{savingPrefs ? "Speichert..." : "Filter speichern"}</button>
          </div>

          {!vapidKey && <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-200"><div className="mb-1 flex items-center gap-2 font-black"><KeyRound size={15} /> Firebase VAPID Key fehlt</div>Firebase Console → Projekteinstellungen → Cloud Messaging → Web Push-Zertifikate. Den Schlüssel lokal in <b>.env.local</b> oder bei Vercel als <b>NEXT_PUBLIC_FIREBASE_VAPID_KEY</b> eintragen.</div>}

          <button type="button" onClick={enablePush} disabled={loading || permission === "denied" || !supported} className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">
            {loading ? "Wird aktiviert..." : permission === "granted" ? "Push erneut verbinden" : permission === "denied" ? "Im Browser blockiert" : "Push aktivieren"}
          </button>

          {permission === "granted" && (
            <button type="button" onClick={sendTestPush} disabled={testing} className="mt-3 w-full rounded-2xl bg-slate-800 py-3 text-sm font-black text-white disabled:opacity-60">
              {testing ? "Test wird gesendet..." : "Test-Push senden"}
            </button>
          )}

          {message && <p className="mt-3 rounded-2xl bg-slate-950/50 p-3 text-xs text-slate-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}
