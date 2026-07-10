"use client";

export default function ImpressumPage() {
  return (
    <main className="min-h-screen px-5 pb-16 pt-8 text-white">
      <section className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Rechtliches</p>
          <h1 className="text-3xl font-black">Impressum</h1>
          <p className="mt-2 text-sm text-slate-400">Angaben gemäß § 5 DDG</p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <p>
            Leon Span (Inhaber)<br />
            IT-Span<br />
            Gartenstraße 7<br />
            56858 Altstrimmig<br />
            Deutschland
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">Kontakt</h2>
          <p>
            Telefon: +49 152 52097230<br />
            E-Mail: support@it-span.de<br />
            WhatsApp: <a href="https://wa.me/4915252097230" className="text-blue-300 underline">wa.me/4915252097230</a>
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">Verantwortlich für den Inhalt</h2>
          <p>
            Leon Span, Anschrift wie oben.
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen (z. B. von Nutzern erstellte Meldungen) zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>
        </div>

        <div className="glass-card space-y-4 rounded-3xl p-5 text-sm leading-relaxed text-slate-300">
          <h2 className="text-lg font-black text-white">Urheberrecht</h2>
          <p>
            Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter (z. B. von Nutzern hochgeladene Fotos) sind als solche gekennzeichnet; die Verantwortung für deren Inhalt liegt beim jeweiligen Nutzer.
          </p>
        </div>
      </section>
    </main>
  );
}
