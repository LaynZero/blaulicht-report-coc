"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { ExternalLink, Globe, Mail, Star } from "lucide-react";

function LinkCard({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-blue-400/40 hover:bg-slate-900"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-xl">{icon}</div>
        <div>
          <p className="font-black text-white">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <ExternalLink className="shrink-0 text-slate-500" size={18} />
    </a>
  );
}

export default function EntwicklerPage() {
  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Über den Entwickler</p>
          <h1 className="text-3xl font-black">IT-Span</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Blaulicht Report COC wird entwickelt und betreut von IT-Span – Ihr Partner für moderne IT aus Altstrimmig, Kreis Cochem-Zell.
          </p>
        </div>

        <div className="glass-card space-y-2 rounded-3xl p-5">
          <p className="font-black text-white">Leon Span</p>
          <p className="text-sm text-slate-400">Inhaber, IT-Span</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <Mail size={16} className="text-blue-400" />
            <a href="mailto:leon.span@it-span.de" className="underline">leon.span@it-span.de</a>
          </div>
        </div>

        <div className="space-y-3">
          <LinkCard icon={<Globe size={20} className="text-blue-300" />} title="Webseite" subtitle="www.it-span.de" href="https://www.it-span.de" />
          <LinkCard icon={"📘"} title="Facebook" subtitle="IT-Span auf Facebook" href="https://www.facebook.com/profile.php?id=61591414683506" />
          <LinkCard icon={"📸"} title="Instagram" subtitle="@it.span" href="https://www.instagram.com/it.span/" />
          <LinkCard icon={<Star size={20} className="text-amber-300" />} title="Google-Bewertung" subtitle="Sag uns, wie wir waren" href="https://share.google/z4aEDT49Rc3jFnHVg" />
        </div>

        <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5 text-center text-sm leading-relaxed text-blue-100/80">
          Fragen, Ideen oder Interesse an einer eigenen App/Webseite? IT-Span freut sich über jede Nachricht. 💙
        </div>
      </section>
      <BottomNavigation />
    </main>
  );
}
