import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function readServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

/**
 * Initializes the Firebase Admin app exactly once (idempotent across
 * serverless invocations that reuse the same runtime). Returns false when
 * FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid, so callers can respond
 * with a clear setup error instead of throwing.
 */
export function ensureAdminApp(): boolean {
  if (getApps().length) return true;
  const serviceAccount = readServiceAccount();
  if (!serviceAccount) return false;
  initializeApp({ credential: cert(serviceAccount as ServiceAccount) });
  return true;
}

export function getOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export function chunk<T>(items: T[], size = 10) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
