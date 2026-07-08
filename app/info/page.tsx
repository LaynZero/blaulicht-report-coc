import BottomNavigation from "@/components/BottomNavigation";
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
  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            Info
          </p>
          <h1 className="text-3xl font-black">Blaulicht Report COC</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Hinweise für sichere, schnelle und faire Meldungen in der Community.
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5">
          <div className="flex gap-3">
            <Siren className="shrink-0 text-blue-400" />
            <p className="text-sm text-slate-300">
              <b>Kurz und hilfreich melden.</b>
              <br />
              Abkürzungen wie „AVK“, „Blitzer“ oder „Stau“ sind okay. Wichtig
              ist, dass andere direkt verstehen, was los ist.
            </p>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="shrink-0 text-green-400" />
            <p className="text-sm text-slate-300">
              <b>Nur echte Meldungen.</b>
              <br />
              Keine Fake-Meldungen, keine Gerüchte, keine privaten Namen,
              Kennzeichen oder sensiblen Daten posten.
            </p>
          </div>
          <div className="flex gap-3">
            <CircleAlert className="shrink-0 text-yellow-400" />
            <p className="text-sm text-slate-300">
              <b>Keine Behinderung von Einsatzkräften.</b>
              <br />
              Die App dient zur Information. Folge immer den Anweisungen von
              Polizei, Feuerwehr und Rettungsdienst.
            </p>
          </div>
          <div className="flex gap-3">
            <MessageCircle className="shrink-0 text-violet-400" />
            <p className="text-sm text-slate-300">
              <b>Respektvoll bleiben.</b>
              <br />
              Kommentare sollen helfen. Beleidigungen, Streit oder unnötige
              Diskussionen können gelöscht werden.
            </p>
          </div>
          <div className="flex gap-3">
            <Bell className="shrink-0 text-orange-300" />
            <p className="text-sm text-slate-300">
              <b>Push-Benachrichtigungen.</b>
              <br />
              Du kannst Push im Profil aktivieren, damit du neue wichtige
              Meldungen schneller mitbekommst.
            </p>
          </div>
          <div className="flex gap-3">
            <UserCheck className="shrink-0 text-cyan-300" />
            <p className="text-sm text-slate-300">
              <b>Admin & Entwickler.</b>
              <br />
              Offizielle Accounts erkennst du an Admin- oder Entwickler-Badges.
              Bei Fragen nutzt du den Support-Tab.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5">
          <div className="flex items-center gap-3">
            <HeartHandshake className="text-blue-300" />
            <h2 className="text-lg font-black">Community-Hinweis</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/80">
            Je genauer und fairer die Meldungen sind, desto nützlicher wird die
            App für alle im COC-Gebiet. Lieber kurz und korrekt als lang und
            unsicher.
          </p>
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
