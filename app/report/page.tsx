export default function ReportPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        🚨 Neue Meldung
      </h1>

      <div className="space-y-5">

        <div>
          <label className="block mb-2">Kategorie</label>
          <select className="w-full rounded-xl bg-slate-900 border border-slate-700 p-4">
            <option>🚓 Verkehrskontrolle</option>
            <option>🚨 Unfall</option>
            <option>🚧 Stau</option>
            <option>🚒 Feuerwehr</option>
            <option>🚑 Rettungsdienst</option>
            <option>📸 Blitzer</option>
            <option>❓ Sonstiges</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Ort</label>
          <input
            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-4"
            placeholder="z.B. Cochem B49"
          />
        </div>

        <div>
          <label className="block mb-2">Beschreibung</label>
          <textarea
            rows={6}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-4"
            placeholder="Was ist passiert?"
          />
        </div>

        <button className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold hover:bg-blue-700 transition">
          Meldung veröffentlichen
        </button>

      </div>
    </main>
  );
}