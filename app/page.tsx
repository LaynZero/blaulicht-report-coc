import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/AppHeader";
import ReportCard from "@/components/feed/ReportCard";
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
          <ReportCard
  key={index}
  category={report.category}
  location={report.location}
  time={report.time}
  text={report.text}
  confirmations={report.confirmations}
  comments={report.comments}
/>
        ))}
      </section>

      <BottomNavigation />
    </main>
  );
}