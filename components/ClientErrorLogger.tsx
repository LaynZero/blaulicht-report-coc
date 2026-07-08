"use client";

import { useEffect } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";

export default function ClientErrorLogger() {
  const { user } = useAuth();

  useEffect(() => {
    async function saveCrashLog(message: string, source?: string, stack?: string) {
      try {
        await addDoc(collection(db, "crashLogs"), {
          message: message.slice(0, 900),
          source: source || "client",
          stack: stack?.slice(0, 2500) || "",
          userId: user?.uid || "anonymous",
          url: window.location.href,
          userAgent: navigator.userAgent,
          createdAt: serverTimestamp(),
        });
      } catch {
        // Fehlerlogging darf die App nie blockieren.
      }
    }

    const onError = (event: ErrorEvent) => {
      saveCrashLog(event.message || "Unbekannter Client-Fehler", event.filename, event.error?.stack);
    };
    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      saveCrashLog(reason?.message || String(reason || "Unhandled Promise Rejection"), "unhandledrejection", reason?.stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [user?.uid]);

  return null;
}
