import BottomNavigation from "@/components/BottomNavigation";
import { Bell, MapPinned, MessageCircle, ShieldCheck } from "lucide-react";

export default function InfoPage() {
  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Info</p>
          <h1 className="text-3xl font-black">Blaulicht Report COC</h1>
          <p className="mt-2 text-sm text-slate-400">Kurze Regeln und Hinweise für eine saubere Community.</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5">
          <div className="flex gap-3"><ShieldCheck className="shrink-0 text-green-400" /><p className="text-sm text-slate-300"><b>Nur echte Meldungen posten.</b><br />Keine Fake-Meldungen, keine Namen von Betroffenen und keine sensiblen Details.</p></div>
          <div className="flex gap-3"><MapPinned className="shrink-0 text-blue-400" /><p className="text-sm text-slate-300"><b>Ort ist optional.</b><br />Wenn du einen Ort angibst oder deinen Standort nutzt, erscheint die Meldung besser auf der Karte.</p></div>
          <div className="flex gap-3"><MessageCircle className="shrink-0 text-violet-400" /><p className="text-sm text-slate-300"><b>Kommentare freundlich halten.</b><br />Beleidigungen oder unnötige Diskussionen werden gelöscht.</p></div>
          <div className="flex gap-3"><Bell className="shrink-0 text-yellow-400" /><p className="text-sm text-slate-300"><b>Push-Benachrichtigungen.</b><br />Kannst du im Profil aktivieren, sobald der Firebase Web Push Key eingetragen ist.</p></div>
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
