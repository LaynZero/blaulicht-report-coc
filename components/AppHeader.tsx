import Image from "next/image";
import UserStatus from "./UserStatus";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white p-1 blue-glow">
            <Image src="/logo.png" alt="Blaulicht Report Cochem Logo" fill className="object-contain" priority />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Blaulicht Report</p>
            <h1 className="truncate text-2xl font-black">COC Live</h1>
          </div>
        </div>
        <UserStatus />
      </div>
    </header>
  );
}
