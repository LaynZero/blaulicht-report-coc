import type { getFirestore } from "firebase-admin/firestore";
import type { AdminContext, AdminRequester } from "./adminAuth";
import type { UserRole } from "@/lib/types";

type Firestore = ReturnType<typeof getFirestore>;

export class AdminActionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function deleteQueryBatched(firestore: Firestore, query: FirebaseFirestore.Query, maxDocs = 500) {
  const snap = await query.limit(maxDocs).get();
  if (snap.empty) return 0;

  const batch = firestore.batch();
  snap.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  return snap.size;
}

async function deleteSupportTicketsForUser(firestore: Firestore, uid: string) {
  const ticketsSnap = await firestore.collection("supportTickets").where("createdBy", "==", uid).limit(100).get();

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

/**
 * Applies a role change to a target user, enforcing that admins may not
 * touch developer accounts or grant the developer role. Throws AdminActionError
 * with an appropriate HTTP status on any validation failure.
 */
export async function applyRoleChange(admin: AdminContext, requester: AdminRequester, uid: string, nextRole: UserRole) {
  const targetRef = admin.firestore.collection("users").doc(uid);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new AdminActionError("Nutzer nicht gefunden.", 404);

  const target = targetSnap.data() as { role?: UserRole };
  const currentRole = target.role || "user";

  if (requester.role === "admin") {
    if (currentRole === "developer" || nextRole === "developer") {
      throw new AdminActionError("Entwickler sind geschützt. Nur Entwickler dürfen Entwickler-Rollen verwalten.", 403);
    }
    if (nextRole !== "user" && nextRole !== "admin") {
      throw new AdminActionError("Admins dürfen nur User/Admin setzen.", 403);
    }
  }

  await targetRef.update({ role: nextRole });
  return nextRole;
}

/**
 * Fully removes a user: Firestore user + username doc, all owned content
 * (reports, comments, messages, tickets, push tokens, notifications, crash
 * logs) and the Firebase Auth account itself. Developers and admins cannot
 * be deleted directly (admins must be demoted first).
 */
export async function removeUserAccount(admin: AdminContext, requester: AdminRequester, uid: string) {
  if (uid === requester.uid) throw new AdminActionError("Du kannst dich nicht selbst löschen.", 400);

  const targetRef = admin.firestore.collection("users").doc(uid);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new AdminActionError("Nutzer nicht gefunden.", 404);

  const target = targetSnap.data() as { role?: UserRole; username?: string };
  const targetRole = target.role || "user";

  if (targetRole === "developer") throw new AdminActionError("Entwickler können nicht gelöscht werden.", 403);
  if (targetRole === "admin") {
    throw new AdminActionError("Admins können nicht direkt gelöscht werden. Entziehe zuerst die Admin-Rolle.", 403);
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
}
