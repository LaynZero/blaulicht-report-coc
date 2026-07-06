export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md justify-between text-xs text-slate-300">
        <a href="/" className="flex flex-col items-center gap-1">
          <span className="text-lg">🏠</span>
          Feed
        </a>

        <a href="/report" className="flex flex-col items-center gap-1 text-blue-400">
          <span className="text-lg">➕</span>
          Melden
        </a>

        <a href="/map" className="flex flex-col items-center gap-1">
          <span className="text-lg">🗺</span>
          Karte
        </a>

        <a href="/admin" className="flex flex-col items-center gap-1">
          <span className="text-lg">🛡️</span>
          Admin
        </a>

        <a href="/profile" className="flex flex-col items-center gap-1">
          <span className="text-lg">👤</span>
          Profil
        </a>
      </div>
    </nav>
  );
}