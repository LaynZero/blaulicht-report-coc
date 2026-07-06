import type { ReportCategory } from "./types";

export const reportCategories: { value: ReportCategory; label: string; icon: string }[] = [
  { value: "Verkehrskontrolle", label: "Verkehrskontrolle", icon: "🚓" },
  { value: "Blitzer", label: "Blitzer", icon: "📸" },
  { value: "Unfall", label: "Unfall", icon: "🚨" },
  { value: "Stau", label: "Stau", icon: "🚧" },
  { value: "Baustelle", label: "Baustelle", icon: "🏗️" },
  { value: "Feuerwehr", label: "Feuerwehr", icon: "🚒" },
  { value: "Rettungsdienst", label: "Rettungsdienst", icon: "🚑" },
  { value: "Sonstiges", label: "Sonstiges", icon: "❓" },
];

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
