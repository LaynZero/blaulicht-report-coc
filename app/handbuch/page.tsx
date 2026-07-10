"use client";

import BottomNavigation from "@/components/BottomNavigation";
import {
  Apple,
  Bell,
  Camera,
  HelpCircle,
  MessageCircle,
  Phone,
  Shield,
  Siren,
  Smartphone,
  UserPlus,
} from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card space-y-3 rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <Icon className="shrink-0 text-blue-400" size={22} />
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export default function HandbuchPage() {
  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Handbuch</p>
          <h1 className="text-3xl font-black">Nutzerhandbuch</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Alles Wichtige zur Installation und Nutzung von Blaulicht Report COC – und wer euch bei Problemen weiterhilft.
          </p>
        </div>

        <Section icon={Smartphone} title="1. Über die App">
          <p>Blaulicht Report COC ist eine Community-App für den Landkreis Cochem-Zell. Teilt Verkehrsmeldungen, Warnungen und wichtige Hinweise live, bestätigt Meldungen anderer oder markiert sie als nicht mehr aktuell – und werdet per Push sofort informiert.</p>
          <p>Die App läuft direkt im Browser, ganz ohne App-Store-Download, und lässt sich wie eine normale App auf dem Homescreen installieren.</p>
        </Section>

        <Section icon={Apple} title="2. Installation – iPhone (Safari)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Safari öffnen und blaulichtreport.it-span.de aufrufen.</li>
            <li>Unten rechts auf das Teilen-Symbol tippen.</li>
            <li>„Zum Home-Bildschirm" auswählen.</li>
            <li>„Als Web-App öffnen" aktiviert lassen und auf „Hinzufügen" tippen.</li>
          </ol>
        </Section>

        <Section icon={Smartphone} title="Installation – Android (Chrome)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Chrome öffnen und blaulichtreport.it-span.de aufrufen.</li>
            <li>Oben rechts auf die drei Punkte tippen.</li>
            <li>„Zum Startbildschirm hinzufügen" auswählen.</li>
            <li>Auf „Installieren" tippen.</li>
          </ol>
          <p className="text-xs text-slate-500">Ein Release im Google Play Store ist bereits in Vorbereitung und folgt demnächst – bis dahin funktioniert die Installation wie oben beschrieben genauso zuverlässig.</p>
        </Section>

        <Section icon={UserPlus} title="3. Erste Schritte">
          <p><b>Registrierung:</b> Mit E-Mail-Adresse und Passwort oder direkt über euer Google-Konto. Wählt dabei einen Anzeigenamen und einen eindeutigen @Benutzernamen.</p>
          <p><b>Login:</b> Ihr bleibt auf dem Gerät angemeldet, bis ihr euch aktiv abmeldet.</p>
        </Section>

        <Section icon={Siren} title="4. Feed & Meldungen">
          <p>Der Feed zeigt alle aktuellen Meldungen, neueste zuerst. Meldungen werden automatisch 24 Stunden nach Erstellung entfernt, damit der Feed immer aktuell bleibt.</p>
          <p>Über den blauen Plus-Button erstellt ihr eine neue Meldung: Kategorie wählen, optional Ort und Beschreibung eingeben, optional Foto oder Sprachnachricht anhängen.</p>
          <p className="text-xs text-slate-500">Zwischen zwei Meldungen liegt eine kurze Wartezeit (Spam-Schutz) – das ist normal.</p>
        </Section>

        <Section icon={Camera} title="Bestätigen, nicht mehr aktuell, melden">
          <p>Jede Meldung kann von anderen Nutzern bestätigt, als nicht mehr aktuell markiert, oder bei Missbrauch gemeldet werden. So bleibt die Community-Information verlässlich.</p>
        </Section>

        <Section icon={Bell} title="Push-Benachrichtigungen">
          <p>Im Profilbereich aktivieren und auswählen, für welche Kategorien ihr benachrichtigt werden wollt. Eilmeldungen und offizielle Beiträge werden unabhängig davon gesondert hervorgehoben.</p>
        </Section>

        <Section icon={MessageCircle} title="Kommentare">
          <p>Kommentare unter Meldungen können ausschließlich von Admins und Entwicklern geschrieben werden – das hält den Feed übersichtlich.</p>
        </Section>

        <Section icon={HelpCircle} title="5. Häufige Fragen">
          <p><b>Keine Push-Benachrichtigungen?</b><br />Push im Profil aktiviert? Passende Kategorien ausgewählt? Benachrichtigungs-Einstellungen des Betriebssystems für die App prüfen.</p>
          <p><b>Foto-/Sprachnachrichten-Upload hängt?</b><br />Internetverbindung prüfen, App komplett schließen und neu öffnen. Bleibt's, meldet es über Support.</p>
          <p><b>Login klappt nicht?</b><br />E-Mail/Passwort auf Tippfehler prüfen, „Passwort vergessen" nutzen, oder direkt beim Team melden.</p>
        </Section>

        <Section icon={Shield} title="6. Community-Regeln">
          <ul className="list-disc space-y-1 pl-5">
            <li>Kurz und hilfreich melden – Abkürzungen wie „AVK" oder „Blitzer" sind okay.</li>
            <li>Keine sensiblen Details – keine privaten Namen, Kennzeichen oder Gerüchte.</li>
            <li>Keine Einsatz-Neugier – die App dient der Warnung, nicht der Spekulation.</li>
            <li>Nur echte, aktuelle Meldungen posten.</li>
          </ul>
          <p className="text-xs text-slate-500">Die vollständigen Gruppenregeln findet ihr unter „Info".</p>
        </Section>

        <div className="rounded-3xl border border-blue-400/30 bg-blue-600/10 p-5">
          <div className="flex items-center gap-3">
            <Phone className="text-blue-300" size={22} />
            <h2 className="text-lg font-black">7. Direkter Ansprechpartner</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/80">
            Bei Störungen, Bugs oder Ideen ist der schnellste Weg der Support-Bereich in der App („Bug melden" / „Idee senden"). Direkter Kontakt zum Entwickler-Team:
          </p>
          <div className="mt-4 space-y-1 rounded-2xl bg-slate-950/40 p-4 text-sm">
            <p className="font-bold">Leon Span – IT-Span</p>
            <p>Telefon: +49 152 52097230</p>
            <p>E-Mail: blaulichtreport@it-span.de</p>
            <p>Leon Span (persönlich): leon.span@it-span.de</p>
            <p>
              WhatsApp:{" "}
              <a href="https://wa.me/4915252097230" className="text-blue-300 underline">
                wa.me/4915252097230
              </a>
            </p>
          </div>
        </div>

        <a href="/entwickler" className="block rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-center text-sm font-bold text-slate-300 hover:bg-slate-900">
          💙 Über den Entwickler
        </a>

        <div className="grid grid-cols-2 gap-3">
          <a href="/datenschutz" className="block rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-center text-sm font-bold text-slate-300 hover:bg-slate-900">
            Datenschutz
          </a>
          <a href="/impressum" className="block rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-center text-sm font-bold text-slate-300 hover:bg-slate-900">
            Impressum
          </a>
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
