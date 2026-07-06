import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/AppHeader";
export default function Home() {
  const reports = [
    {
      category: "🚓 Verkehrskontrolle",
      location: "Cochem, B49",
      time: "vor 3 Minuten",
      text: "Kontrolle kurz hinter der Moselbrücke Richtung Zell.",
      confirmations: 18,
      comments: 6,
    },
    {
      category: "🚧 Stau",
      location: "Zell, Brücke",
      time: "vor 12 Minuten",
      text: "Stockender Verkehr Richtung Bullay.",
      confirmations: 9,
      comments: 2,
    },
    {
      category: "🚨 Unfall",
      location: "B421 Richtung Blankenrath",
      time: "vor 25 Minuten",
      text: "Unfallstelle bitte langsam fahren.",
      confirmations: 14,
      comments: 4,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24">
      <AppHeader />

      <section className="px-5 py-4">
        <a
  href="/report"
  className="block w-full rounded-2xl bg-blue-600 py-4 text-center font-bold shadow-lg shadow-blue-600/30"
>
  + Neue Meldung posten
</a>
      </section>

      <section className="space-y-4 px-5">
        {reports.map((report, index) => (
          <article
            key={index}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm">
                {report.category}
              </span>
              <span className="text-sm text-slate-400">{report.time}</span>
            </div>

            <h2 className="text-lg font-bold">{report.location}</h2>
            <p className="mt-2 text-slate-300">{report.text}</p>

            <div className="mt-4 flex justify-between text-sm text-slate-400">
              <span>✅ {report.confirmations} bestätigt</span>
              <span>💬 {report.comments} Kommentare</span>
            </div>
          </article>
        ))}
      </section>

      <BottomNavigation />
    </main>
  );
}