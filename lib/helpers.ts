import type { ReportCategory } from "./types";

export const reportCategories: { value: ReportCategory; label: string; icon: string }[] = [
  { value: "Stau", label: "Stau", icon: "🚧" },
  { value: "Unfall", label: "Unfall", icon: "🚨" },
  { value: "Baustelle", label: "Baustelle", icon: "🏗️" },
  { value: "Verkehrskontrolle", label: "Verkehrskontrolle", icon: "🚓" },
  { value: "Blitzer", label: "Blitzer", icon: "📸" },
  { value: "Sonstiges", label: "Sonstiges", icon: "❓" },
];


export const DEFAULT_GROUP_RULES = `Gruppenregeln

Diese Gruppe dient dazu, um vor Gefahren und Beeinträchtigungen im Straßenverkehr zu warnen, nicht um die persönliche "Neugier" zu befriedigen oder um persönliche Meinungen abzugeben.

‼️ VERBOTEN
sind beleidigende, rassistische, politische o. ä. Kommentare.

‼️ UNERWÜNSCHT
• Infos zu AVK & Blitzer an Schulen, Kiga, Zone 30
• Einzelheiten/Fragen zu laufenden Einsätzen von RD, FFW u. ä.
• Kommentare wie "Sirene in XYZ" & "Danke" o. ä.
• Details zu Einsatzfahrzeugen, wie z. B. KFZ-Kennzeichen
• Meldungen zu Wildtieren in Fahrbahnnähe (Ausnahme: Tiere auf der Autobahn)
• Meldungen zu toten Tieren, die am Rand/neben der Fahrbahn liegen (Tote Tiere auf der Fahrbahn dürfen natürlich nach wie vor gemeldet werden)
• Kommentare zu Meldungen jeglicher Art

‼️ VORHER ABZUSPRECHEN
• Einsätze von besonderem öffentlichen Interesse (z. B. Banküberfall XY)
• Suche/Sichtung freilaufender Hunde/Großtiere (in unserem Landkreis!)
• Werbung

‼️ Das Adminteam behält sich vor, Mitglieder, die sich nicht an die Regeln halten, ggf. nach einmaliger Verwarnung aus der Gruppe zu nehmen.`;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
}

export function isReservedUsername(username: string) {
  return ["admin", "administrator", "entwickler", "developer", "polizei", "polizei-cochem", "it-span", "itspan", "support", "moderator", "blaulicht", "coc"].includes(username);
}

export function formatRelativeTime(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value) || typeof value.toDate !== "function") return "gerade eben";
  const date = value.toDate() as Date;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tg.`;
}

export function categoryEmoji(category: string) {
  return reportCategories.find((item) => item.value === category)?.icon ?? "🚨";
}

export function extractMentions(text: string) {
  const matches = text.match(/@[a-z0-9_.]{3,20}/gi) ?? [];
  return [...new Set(matches.map((item) => normalizeUsername(item.replace('@', ''))))];
}


export function getTimestampMillis(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  if ("toDate" in value && typeof value.toDate === "function") return (value.toDate() as Date).getTime();
  if ("seconds" in value && typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

export function isExpiredArchived(status: string | undefined, updatedAt: unknown, createdAt: unknown, archiveAfterMs = 24 * 60 * 60 * 1000) {
  if (status !== "expired") return false;
  const base = getTimestampMillis(updatedAt) || getTimestampMillis(createdAt);
  return Boolean(base && Date.now() - base > archiveAfterMs);
}


