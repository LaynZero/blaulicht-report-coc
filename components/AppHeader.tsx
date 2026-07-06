import { Siren } from "lucide-react";
import UserStatus from "./UserStatus";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-3 blue-glow">
            <Siren size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">Blaulicht Report</p>
            <h1 className="text-2xl font-black">COC Live</h1>
          </div>
        </div>
        <UserStatus />
      </div>
    </header>
  );
}
