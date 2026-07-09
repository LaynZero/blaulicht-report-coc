const STORAGE_KEY = "bcoc_device_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5; // 5 years

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; samesite=lax`;
}

/**
 * Returns a persistent per-browser device ID, creating one on first call.
 * Stored in both localStorage and a cookie so that clearing only one of the
 * two doesn't generate a fresh identity. Not a hardware ID — a determined
 * user can still reset both (e.g. "clear site data") or switch browsers.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let id = "";
  try {
    id = window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    // localStorage may be unavailable (privacy mode, blocked storage) — fall through to cookie.
  }

  if (!id) id = readCookie(STORAGE_KEY);
  if (!id) id = crypto.randomUUID();

  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ignore — cookie mirror below still works.
  }
  writeCookie(STORAGE_KEY, id);

  return id;
}
