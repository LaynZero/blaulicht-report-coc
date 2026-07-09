"use client";

import { ShieldOff } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function DeviceBanGate({ children }: { children: React.ReactNode }) {
  const { deviceBanned } = useAuth();

  if (!deviceBanned) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-8 text-white">
      <section className="glass-card max-w-md rounded-[2rem] p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/15 text-red-300">
          <ShieldOff size={28} />
        </div>
        <h1 className="mt-4 text-2xl font-black">Gerät gesperrt</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Dieses Gerät wurde von der Nutzung von Blaulicht Report COC ausgeschlossen. Das Erstellen oder Verwenden von Accounts ist auf diesem Gerät nicht mehr möglich.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Falls du das für einen Fehler hältst, wende dich per E-Mail an den IT-Span Support.
        </p>
      </section>
    </main>
  );
}
