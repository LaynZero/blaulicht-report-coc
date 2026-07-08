"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { db } from "@/app/firebase";
import { useAuth } from "@/app/context/AuthContext";
import type { AppSettings } from "@/lib/types";

const defaultSettings: AppSettings = {
  maintenanceMode: false,
  allowAdminsDuringMaintenance: true,
  maintenanceMessage:
    "Wir führen gerade Wartungsarbeiten durch. Bitte versuche es gleich noch einmal.",
};

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userData, loading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "appSettings", "main"),
      (snap) => {
        setSettings(snap.exists() ? ({ ...defaultSettings, ...snap.data() } as AppSettings) : defaultSettings);
        setSettingsLoading(false);
      },
      () => {
        setSettings(defaultSettings);
        setSettingsLoading(false);
      },
    );

    return () => unsub();
  }, []);

  if (settingsLoading || loading) return <>{children}</>;

  if (!settings.maintenanceMode) return <>{children}</>;

  const canEnterAsDeveloper = userData?.role === "developer";
  const canEnterAsAdmin = settings.allowAdminsDuringMaintenance && userData?.role === "admin";
  const isLoginPage = pathname === "/login";

  if (canEnterAsDeveloper || canEnterAsAdmin || isLoginPage) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <section className="glass-card max-w-md rounded-[2rem] p-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-300">
          <Wrench size={30} />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-amber-300">
          Wartungsmodus
        </p>
        <h1 className="mt-2 text-3xl font-black">App kurz nicht verfügbar</h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
          {settings.maintenanceMessage || defaultSettings.maintenanceMessage}
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left text-xs leading-relaxed text-slate-400">
          Entwickler dürfen immer rein. Admin-Zugriff während Wartung ist aktuell {settings.allowAdminsDuringMaintenance ? "erlaubt" : "gesperrt"}.
        </div>
        {!user && (
          <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20">
            Admin / Entwickler Login
          </Link>
        )}
      </section>
    </main>
  );
}
