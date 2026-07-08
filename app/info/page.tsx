"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import { db } from "@/app/firebase";
import { DEFAULT_GROUP_RULES } from "@/lib/helpers";
import {
  Bell,
  CircleAlert,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Siren,
  UserCheck,
} from "lucide-react";

export default function InfoPage() {
  const [groupRules, setGroupRules] = useState(DEFAULT_GROUP_RULES);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "appSettings", "main"), (snap) => {
      const rules = snap.data()?.groupRules;
      setGroupRules(typeof rules === "string" && rules.trim() ? rules : DEFAULT_GROUP_RULES);
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Info</p>
          <h1 className="text-3xl font-black">Blaulicht Report COC</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Hinweise, Regeln und wichtige Informationen für die Community.
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5">
          <div className="flex gap-3">
            <Siren className="shrink-0 text-blue-400" />
            <p className="text-sm text-slate-300"><b>Kurz und hilfreich melden.</b><br />Abkürzungen wie „AVK“, „Blitzer“ oder „Stau“ sind okay. Wichtig ist, dass andere direkt verstehen, was los ist.</p>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="shrink-0 text-green-400" />
            <p className="text-sm text-slate-300"><b>Keine sensiblen Details.</b><br />Keine privaten Namen, Kennzeichen, Gerüchte oder Details zu Einsatzfahrzeugen posten.</p>
          </div>
          <div className="flex gap-3">
            <CircleAlert className="shrink-0 text-yellow-400" />
            <p className="text-sm text-slate-300"><b>Keine Einsatz-Neugier.</b><br />Die App dient zur Warnung vor Gefahren und Verkehrsbeeinträchtigungen, nicht für Spekulationen zu Einsätzen.</p>
          </div>
          <div className="flex gap-3">
            <MessageCircle className="shrink-0 text-violet-400" />
            <p className="text-sm text-slate-300"><b>Kommentare sind moderiert.</b><br />Kommentare können nur Admins und Entwickler schreiben. So bleibt der Feed sauber und übersichtlich.</p>
          </div>
          <div className="flex gap-3">
            <Bell className="shrink-0 text-orange-300" />
            <p className="text-sm text-slate-300"><b>Push-Benachrichtigungen.</b><br />Im Profil kannst du Push aktivieren und auswählen, für welche Kategorien du benachrichtigt werden möchtest.</p>
          </div>
          <div className="flex gap-3">
            <UserCheck className="shrink-0 text-cyan-300" />
            <p className="text-sm text-slate-300"><b>Offizielle Accounts.</b><br />Admin- und Entwickler-Badges zeigen dir, welche Beiträge und Kommentare offiziell sind.</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h2 className="mb-3 text-xl font-black">📖 Gruppenregeln</h2>
          <div className="max-h-[520px] overflow-y-auto whitespace-pre-line rounded-2xl bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-300">
            {groupRules}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5">
          <div className="flex items-center gap-3">
            <HeartHandshake className="text-blue-300" />
            <h2 className="text-lg font-black">Community-Hinweis</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/80">
            Je genauer und fairer die Meldungen sind, desto nützlicher wird die App für alle im COC-Gebiet. Lieber kurz und korrekt als lang und unsicher.
          </p>
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
