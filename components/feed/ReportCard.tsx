import { MapPin, MessageCircle, ShieldCheck, Navigation, Flag } from "lucide-react";

type ReportCardProps = {
  category: string;
  location: string;
  time: string;
  text: string;
  confirmations: number;
  comments: number;
  status?: "confirmed" | "new" | "expired";
};

export default function ReportCard({
  category,
  location,
  time,
  text,
  confirmations,
  comments,
  status = "confirmed",
}: ReportCardProps) {
  const statusText = {
    confirmed: "Bestätigt",
    new: "Neu",
    expired: "Abgelaufen",
  };

  return (
    <article className="glass-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-blue-600/20 px-3 py-1 text-sm font-semibold text-blue-300">
          {category}
        </span>

        <span className="text-xs text-slate-400">{time}</span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <MapPin size={18} className="text-red-400" />
        <h2 className="text-lg font-bold">{location}</h2>
      </div>

      <p className="text-slate-300">{text}</p>

      <div className="mt-4 rounded-2xl bg-slate-950/60 p-3 text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <ShieldCheck size={17} />
          {statusText[status]} · {confirmations} Nutzer
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <button className="rounded-xl bg-slate-800 py-3 text-slate-200">
          ✅ Bestätigen
        </button>

        <button className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <MessageCircle size={16} />
          {comments}
        </button>

        <button className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-3 text-slate-200">
          <Navigation size={16} />
          Route
        </button>
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-sm text-red-300">
        <Flag size={15} />
        Beitrag melden
      </button>
    </article>
  );
}