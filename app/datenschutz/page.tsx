"use client";

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen px-5 pb-16 pt-8 text-white">
      <section className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Datenschutz</p>
          <h1 className="text-3xl font-black">Datenschutzerklärung</h1>
          <p className="mt-2 text-sm text-slate-400">Stand: Juli 2026</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            Leon Span (Inhaber, IT-Span)<br />
            Gartenstraße 7<br />
            56858 Altstrimmig<br />
            E-Mail: leon.span@it-span.de
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">2. Übersicht der Verarbeitungen</h2>
          <p>
            Blaulicht Report COC ist eine Community-App für Live-Meldungen im Kreis Cochem-Zell. Zur Bereitstellung dieses Dienstes verarbeiten wir personenbezogene Daten, die für Registrierung, Nutzung und Betrieb der App erforderlich sind. Im Folgenden erläutern wir, welche Daten das sind, wofür wir sie nutzen und auf welcher Rechtsgrundlage.
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">3. Registrierung und Nutzerkonto</h2>
          <p>Bei der Registrierung verarbeiten wir: E-Mail-Adresse, Anzeigename, selbst gewählter Benutzername, verschlüsseltes Passwort (bzw. bei Anmeldung über Google: die von Google bereitgestellten Kontodaten). Optional könnt ihr zusätzlich ein Profilbild, eine kurze Bio und einen Ort angeben.</p>
          <p><b>Zweck:</b> Bereitstellung eines Nutzerkontos, Identifikation innerhalb der Community.<br /><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung – Nutzung der App setzt ein Konto voraus).</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">4. Meldungen (Fotos, Sprachnachrichten, Textinhalte)</h2>
          <p>Wenn ihr eine Meldung erstellt, verarbeiten wir die von euch eingegebenen Inhalte: Kategorie, Ortsangabe (frei eingegebener Text, keine automatische GPS-Erfassung), Beschreibungstext sowie optional hochgeladene Fotos und Sprachaufnahmen. Diese werden mit eurem Anzeigenamen und Benutzernamen verknüpft veröffentlicht.</p>
          <p>Fotos und Sprachnachrichten werden in Firebase Storage (Google) gespeichert, Textinhalte in der Firestore-Datenbank (ebenfalls Google).</p>
          <p><b>Speicherdauer:</b> Meldungen werden automatisch 24 Stunden nach Erstellung gelöscht.</p>
          <p><b>Zweck:</b> Kernfunktion der App – Warnung anderer Nutzer vor Verkehrsbeeinträchtigungen und Gefahren.<br /><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. b DSGVO.</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">5. Push-Benachrichtigungen</h2>
          <p>Wenn ihr Push-Benachrichtigungen aktiviert, wird über den Firebase-Cloud-Messaging-Dienst (Google) ein geräteseitiges Push-Token erzeugt und bei uns gespeichert, um euch über neue Meldungen in den von euch gewählten Kategorien zu informieren. Ihr könnt Push jederzeit im Profilbereich deaktivieren.</p>
          <p><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch aktives Aktivieren).</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">6. Geräte-Kennung (Missbrauchsschutz)</h2>
          <p>Zum Schutz der Community vor wiederholter Umgehung von Account-Sperren erzeugen wir eine zufällige, geräteseitig gespeicherte Kennung (kein Zugriff auf Hardware-Kennungen des Geräts). Diese Kennung wird ausschließlich zur Prüfung verwendet, ob ein Gerät von einem Administrator gesperrt wurde, und ist nicht öffentlich einsehbar.</p>
          <p><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionierenden, missbrauchsfreien Community).</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">7. Support-Anfragen</h2>
          <p>Wenn ihr über den Support-Bereich eine Anfrage, einen Bug-Report oder einen Verbesserungsvorschlag einreicht, verarbeiten wir euren Nutzernamen sowie den Inhalt eurer Nachricht, um euch antworten zu können.</p>
          <p><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. b und f DSGVO.</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">8. Hosting und technische Protokolldaten</h2>
          <p>Diese App wird über Vercel Inc. (Hosting) sowie Google Firebase (Datenbank, Authentifizierung, Speicher, Push-Benachrichtigungen) betrieben. Beim Aufruf der App werden technisch bedingt IP-Adresse, Zeitpunkt des Zugriffs und Geräte-/Browserinformationen kurzzeitig durch diese Dienste verarbeitet, um die App auszuliefern und Missbrauch/Angriffe zu erkennen.</p>
          <p><b>Rechtsgrundlage:</b> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren und stabilen Betrieb der App).</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">9. Empfänger und Drittlandübermittlung</h2>
          <p>Wir setzen folgende Auftragsverarbeiter bzw. Dienste ein:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Google Ireland Limited / Google LLC</b> (Firebase: Authentifizierung, Datenbank, Speicher, Push-Benachrichtigungen)</li>
            <li><b>Vercel Inc.</b> (Hosting der Web-Anwendung)</li>
          </ul>
          <p>Beide Anbieter können Daten auch in den USA verarbeiten. Diese Übermittlung stützt sich, soweit anwendbar, auf einen Angemessenheitsbeschluss der EU-Kommission (EU-US Data Privacy Framework) bzw. auf EU-Standardvertragsklauseln. Wir empfehlen, den aktuellen Zertifizierungsstatus beider Anbieter vor Veröffentlichung zu prüfen, da sich dieser ändern kann.</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">10. Eure Rechte</h2>
          <p>Ihr habt jederzeit das Recht auf:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Auskunft über die zu euch gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung eurer Daten bzw. eures Accounts (Art. 17 DSGVO) – jederzeit über das Profil oder per Kontaktaufnahme möglich</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigten Interesses (Art. 21 DSGVO)</li>
            <li>Beschwerde bei einer Datenschutzaufsichtsbehörde, z. B. der Landesbeauftragten für Datenschutz und Informationsfreiheit Rheinland-Pfalz</li>
          </ul>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">11. Kontakt</h2>
          <p>
            Für Fragen zum Datenschutz oder zur Ausübung eurer Rechte wendet euch an: support@it-span.de, oder nutzt den Support-Bereich in der App.
          </p>
        </div>
      </section>
    </main>
  );
}
