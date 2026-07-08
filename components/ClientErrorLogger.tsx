"use client";

import { useEffect, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";

type CrashPayload = {
  message: string;
  source?: string;
  stack?: string;
  filename?: string;
  line?: number;
  column?: number;
  reason?: string;
};

function safeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

export default function ClientErrorLogger() {
  const { user } = useAuth();
  const lastActionRef = useRef("App gestartet");
  const lastLogRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    const rememberAction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const label =
        target?.getAttribute?.("aria-label") ||
        target?.getAttribute?.("title") ||
        target?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ||
        target?.tagName ||
        event.type;
      lastActionRef.current = `${event.type}: ${label}`;
    };

    document.addEventListener("click", rememberAction, true);
    document.addEventListener("submit", rememberAction, true);
    document.addEventListener("change", rememberAction, true);

    async function saveCrashLog(payload: CrashPayload) {
      try {
        const normalizedMessage =
          payload.message === "Script error."
            ? "Script error. Details vom Browser blockiert. Prüfe Browser-Erweiterungen, Service Worker oder externe Scripts."
            : payload.message || "Unbekannter Client-Fehler";
        const key = `${normalizedMessage}|${payload.source || ""}|${window.location.pathname}`;
        const now = Date.now();
        if (lastLogRef.current?.key === key && now - lastLogRef.current.at < 15000) return;
        lastLogRef.current = { key, at: now };

        await addDoc(collection(db, "crashLogs"), {
          message: normalizedMessage.slice(0, 1200),
          source: payload.source || "client",
          stack: payload.stack?.slice(0, 4000) || "",
          filename: payload.filename || "",
          line: payload.line || 0,
          column: payload.column || 0,
          reason: payload.reason?.slice(0, 1200) || "",
          userId: user?.uid || "anonymous",
          url: window.location.href,
          pathname: window.location.pathname,
          userAgent: navigator.userAgent,
          browser: navigator.vendor || "",
          platform: navigator.platform || "",
          language: navigator.language || "",
          online: navigator.onLine,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          screen: `${window.screen.width}x${window.screen.height}`,
          visibilityState: document.visibilityState,
          lastAction: lastActionRef.current,
          createdAt: serverTimestamp(),
        });
      } catch {
        // Fehlerlogging darf die App nie blockieren.
      }
    }

    const onError = (event: ErrorEvent) => {
      saveCrashLog({
        message: event.message || "Unbekannter Client-Fehler",
        source: event.filename || "window.error",
        stack: event.error?.stack,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        reason: safeString(event.error),
      });
    };

    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      saveCrashLog({
        message: reason?.message || safeString(reason, "Unhandled Promise Rejection"),
        source: "unhandledrejection",
        stack: reason?.stack,
        reason: safeString(reason),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      document.removeEventListener("click", rememberAction, true);
      document.removeEventListener("submit", rememberAction, true);
      document.removeEventListener("change", rememberAction, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [user?.uid]);

  return null;
}
