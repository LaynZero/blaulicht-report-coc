import { NextResponse } from "next/server";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type AdminContext = {
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
};

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, message }, { status });
}

function readServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    const json = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

function getAdmin(): AdminContext | null {
  const serviceAccount = readServiceAccount();
  if (!serviceAccount) return null;

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount as ServiceAccount) });
  }

  return { auth: getAuth(), firestore: getFirestore() };
}

async function getRequester(request: Request, admin: AdminContext) {
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

async function deleteQueryBatched(
  firestore: ReturnType<typeof getFirestore>,
  query: FirebaseFirestore.Query,
  maxDocs = 500,
) {
  const snap = await query.limit(maxDocs).get();
  if (snap.empty) return 0;

  const batch = firestore.batch();
  snap.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  return snap.size;
}

async function deleteSupportTicketsForUser(
  firestore: ReturnType<typeof getFirestore>,
  uid: string,
) {
  const ticketsSnap = await firestore
    .collection("supportTickets")
    .where("createdBy", "==", uid)
    .limit(100)
    .get();

  let deleted = 0;
  for (const ticketDoc of ticketsSnap.docs) {
    const messagesSnap = await ticketDoc.ref.collection("messages").limit(500).get();
    const batch = firestore.batch();
    messagesSnap.docs.forEach((messageDoc) => batch.delete(messageDoc.ref));
    batch.delete(ticketDoc.ref);
    await batch.commit();
    deleted += 1 + messagesSnap.size;
  }

  return deleted;
}

export async function POST(request: Request) {
  try {
    const admin = getAdmin();
    if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt oder ist ungültig.", 500);

    const requester = await getRequester(request, admin);
    if (!requester) return jsonError("Kein Zugriff.", 403);

    const body = (await request.json()) as {
      action?: "setRole" | "deleteUser";
      uid?: string;
      role?: UserRole;
    };

    const uid = body.uid?.trim();
    if (!uid) return jsonError("Nutzer-ID fehlt.", 400);

    if (body.action === "setRole") {
      const nextRole = body.role;
      if (nextRole !== "user" && nextRole !== "admin" && nextRole !== "developer") {
        return jsonError("Ungültige Rolle.", 400);
      }

      const targetRef = admin.firestore.collection("users").doc(uid);
      const targetSnap = await targetRef.get();
      if (!targetSnap.exists) return jsonError("Nutzer nicht gefunden.", 404);

      const target = targetSnap.data() as { role?: UserRole };
      const currentRole = target.role || "user";

      if (requester.role === "admin") {
        if (currentRole === "developer" || nextRole === "developer") {
          return jsonError("Entwickler sind geschützt. Nur Entwickler dürfen Entwickler-Rollen verwalten.", 403);
        }
        if (nextRole !== "user" && nextRole !== "admin") {
          return jsonError("Admins dürfen nur User/Admin setzen.", 403);
        }
      }

      await targetRef.update({ role: nextRole });
      return NextResponse.json({ ok: true, role: nextRole });
    }

    if (body.action === "deleteUser") {
      if (uid === requester.uid) return jsonError("Du kannst dich nicht selbst löschen.", 400);

      const targetRef = admin.firestore.collection("users").doc(uid);
      const targetSnap = await targetRef.get();
      if (!targetSnap.exists) return jsonError("Nutzer nicht gefunden.", 404);

      const target = targetSnap.data() as { role?: UserRole; username?: string };
      const targetRole = target.role || "user";

      if (targetRole === "developer") return jsonError("Entwickler können nicht gelöscht werden.", 403);
      if (targetRole === "admin") {
        return jsonError("Admins können nicht direkt gelöscht werden. Entziehe zuerst die Admin-Rolle.", 403);
      }

      const batch = admin.firestore.batch();
      batch.delete(targetRef);
      if (target.username) batch.delete(admin.firestore.collection("usernames").doc(target.username));
      await batch.commit();

      await Promise.all([
        deleteQueryBatched(admin.firestore, admin.firestore.collection("pushTokens").where("uid", "==", uid), 500),
        deleteQueryBatched(admin.firestore, admin.firestore.collection("notifications").where("userId", "==", uid), 500),
        deleteQueryBatched(admin.firestore, admin.firestore.collection("reports").where("authorId", "==", uid), 200),
        deleteQueryBatched(admin.firestore, admin.firestore.collectionGroup("comments").where("authorId", "==", uid), 500),
        deleteQueryBatched(admin.firestore, admin.firestore.collectionGroup("messages").where("authorId", "==", uid), 500),
        deleteSupportTicketsForUser(admin.firestore, uid),
        deleteQueryBatched(admin.firestore, admin.firestore.collection("crashLogs").where("userId", "==", uid), 200),
      ]);

      try {
        await admin.auth.deleteUser(uid);
      } catch (error) {
        const code = (error as { code?: string })?.code || "";
        if (!code.includes("user-not-found")) throw error;
      }

      return NextResponse.json({ ok: true });
    }

    return jsonError("Unbekannte Aktion.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Admin-Aktion fehlgeschlagen.", 500);
  }
}
