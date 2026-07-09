import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ensureAdminApp } from "./firebaseAdmin";
import type { UserRole } from "@/lib/types";

export type AdminContext = {
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
};

export type AdminRequester = {
  uid: string;
  role: "admin" | "developer";
};

/** Standard JSON error response used across all admin API routes. */
export function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, message }, { status });
}

/**
 * Initializes (once) and returns the Firebase Admin SDK context scoped to
 * auth + firestore. Returns null if FIREBASE_SERVICE_ACCOUNT_KEY is
 * missing/invalid so callers can respond with a clear setup error instead of
 * throwing.
 */
export function getAdmin(): AdminContext | null {
  if (!ensureAdminApp()) return null;
  return { auth: getAuth(), firestore: getFirestore() };
}

export type AppRequester = {
  uid: string;
  role: UserRole;
  banned: boolean;
  displayName: string;
  username: string;
  avatarDataUrl: string;
  lastReportAt?: { toMillis?: () => number } | null;
};

/**
 * Verifies the Bearer token and returns the caller's identity + Firestore
 * user doc fields, regardless of role. Returns null if the token is missing/
 * invalid or the user doc doesn't exist. Does NOT check the banned flag —
 * callers that care (e.g. content creation) should check `banned` themselves
 * so they can return a clear message instead of a generic 403.
 */
export async function getVerifiedUser(request: Request, admin: AdminContext): Promise<AppRequester | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;

  const decoded = await admin.auth.verifyIdToken(token);
  const userSnap = await admin.firestore.collection("users").doc(decoded.uid).get();
  if (!userSnap.exists) return null;

  const data = userSnap.data() as {
    role?: UserRole;
    banned?: boolean;
    displayName?: string;
    username?: string;
    avatarDataUrl?: string;
    lastReportAt?: { toMillis?: () => number };
  };

  return {
    uid: decoded.uid,
    role: data.role || "user",
    banned: data.banned === true,
    displayName: data.displayName || "Nutzer",
    username: data.username || "",
    avatarDataUrl: data.avatarDataUrl || "",
    lastReportAt: data.lastReportAt ?? null,
  };
}

/**
 * Verifies the Bearer token on the request and checks that the caller is a
 * non-banned admin or developer. Returns null if any check fails.
 */
export async function getRequester(request: Request, admin: AdminContext): Promise<AdminRequester | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;

  const decoded = await admin.auth.verifyIdToken(token);
  const userSnap = await admin.firestore.collection("users").doc(decoded.uid).get();
  if (!userSnap.exists) return null;

  const data = userSnap.data() as { role?: UserRole; banned?: boolean };
  if (data.banned === true) return null;
  if (data.role !== "admin" && data.role !== "developer") return null;

  return { uid: decoded.uid, role: data.role };
}
