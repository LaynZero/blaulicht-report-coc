"use client";

import BottomNavigation from "@/components/BottomNavigation";
import {
  AlertTriangle,
  Ban,
  Flag,
  MessageCircle,
  Settings,
  Shield,
  ShieldOff,
  UserCog,
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

export default function AdminHandbuchPage() {
  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Für Admins & Entwickler</p>
          <h1 className="text-3xl font-black">Admin-Handbuch</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Alle Funktionen im Admin-Bereich im Überblick – für die tägliche Moderation und Verwaltung von Blaulicht Report COC.
          </p>
        </div>

        <Section icon={UserCog} title="1. Rollen im Überblick">
          <p><b>User:</b> normale Mitglieder, können melden, bestätigen, Push nutzen.</p>
          <p><b>Admin:</b> zusätzlich Nutzer sperren/entsperren, Geräte sperren, Rollen bis „Admin" vergeben, Meldungen löschen, Support-Tickets an „Admin-Support" beantworten, Gruppenregeln bearbeiten.</p>
          <p><b>Developer:</b> alle Admin-Rechte plus Wartungsmodus, Crash-Logs, Entwickler-Rollen vergeben. Entwickler-Accounts sind vor Sperrung/Löschung geschützt.</p>
        </Section>

        <Section icon={UserCog} title="2. Nutzer verwalten">
          <p>Im Admin-Bereich unter „Nutzer suchen" – per Namen oder @Benutzername. Beim ausgewählten Nutzer stehen vier Aktionen zur Verfügung:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Nutzer sperren:</b> Account kann sich nicht mehr einloggen, bestehende Session wird beim nächsten Laden beendet.</li>
            <li><b>Gerät sperren:</b> sperrt alle bekannten Geräte-IDs dieses Nutzers – auf diesen Geräten können danach auch keine neuen Accounts mehr erstellt werden. Nur sinnvoll bei wiederholter Ban-Umgehung, siehe Warnhinweis unten.</li>
            <li><b>Rolle ändern:</b> Admins können nur zwischen User/Admin wechseln, nicht zu Entwickler befördern oder Entwickler-Accounts anfassen.</li>
            <li><b>Account löschen:</b> entfernt den Account inkl. aller Inhalte unwiderruflich. Admins/Entwickler müssen vorher zurückgestuft werden.</li>
          </ul>
        </Section>

        <div className="rounded-3xl border border-orange-400/30 bg-orange-500/10 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-300" size={20} />
            <h2 className="text-lg font-black">Wichtig: Geräte-Sperre mit Bedacht einsetzen</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-orange-100/80">
            Die Geräte-ID ist im Web keine Hardware-Kennung, sondern browserseitig gespeichert – ein Familien- oder WG-Gerät kann von mehreren echten Personen genutzt werden. Nur bei klarer, wiederholter Ban-Umgehung einsetzen, nicht bei einer einzelnen Verfehlung.
          </p>
        </div>

        <Section icon={Flag} title="3. Meldungen moderieren">
          <p>Gemeldete (geflaggte) Beiträge werden im Dashboard separat gezählt. Einzelne Meldungen können direkt gelöscht werden, unabhängig vom Autor – dabei werden auch alle Kommentare der Meldung mitgelöscht, und der Autor bekommt automatisch eine Benachrichtigung über die Glocke.</p>
          <p>Meldungen laufen zusätzlich automatisch 24 Stunden nach Erstellung ab. Über „Dauerhaft behalten" könnt ihr einzelne wichtige Meldungen von dieser automatischen Löschung ausnehmen – ein 📌-Badge zeigt das dann auch den Nutzern im Feed.</p>
        </Section>

        <Section icon={MessageCircle} title="4. Support-Tickets beantworten">
          <p>Nutzer können Anfragen an „Admin-Support" oder „IT-Span Support" (Entwickler) richten – inklusive der Schnellzugänge „Bug melden" und „Idee senden", die automatisch an Entwickler gehen.</p>
          <p>Admins sehen und beantworten nur an sie gerichtete Tickets, Entwickler sehen alle. Ein beantwortetes Ticket zeigt dem Nutzer eine Benachrichtigung im Support-Tab, bis er antwortet oder das Ticket geschlossen wird.</p>
        </Section>

        <Section icon={Settings} title="5. Wartungsmodus (nur Entwickler)">
          <p>Blendet die App für alle Nutzer mit einer Wartungsnachricht aus. Die Option „Admins dürfen trotzdem rein" lässt Admin-/Entwickler-Accounts weiterhin arbeiten, während normale Nutzer die Wartungsseite sehen – praktisch für Updates, die getestet werden sollen, bevor alle wieder reinkönnen.</p>
        </Section>

        <Section icon={Shield} title="6. Gruppenregeln bearbeiten">
          <p>Der Text unter „Info" in der App wird zentral im Admin-Bereich gepflegt (Admins und Entwickler). Änderungen sind sofort für alle Nutzer sichtbar.</p>
        </Section>

        <Section icon={ShieldOff} title="7. Crash-Logs (nur Entwickler)">
          <p>Automatisch erfasste Client-Fehler helfen, Bugs zu finden, bevor Nutzer sie melden. Nur für Entwickler sichtbar, da hier technische Details (Stacktraces) drinstehen können.</p>
        </Section>

        <Section icon={Ban} title="8. Sicherheitsprinzipien, die bewusst so gebaut sind">
          <ul className="list-disc space-y-1 pl-5">
            <li>Entwickler können von Admins weder gesperrt, noch in der Rolle verändert, noch gelöscht werden.</li>
            <li>Admins können sich nicht selbst löschen (Schutz vor Versehen).</li>
            <li>Admin-Accounts müssen erst zu „User" zurückgestuft werden, bevor sie gelöscht werden können.</li>
            <li>Alle Admin-Aktionen laufen über eine serverseitige, geprüfte Route – nicht direkt über die Datenbank, damit nichts umgangen werden kann.</li>
          </ul>
        </Section>
      </section>
      <BottomNavigation />
    </main>
  );
}
