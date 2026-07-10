import { NextResponse } from "next/server";
import { getAdmin, getVerifiedUser, jsonError } from "@/lib/server/adminAuth";
import { AdminActionError, deleteOwnAccount } from "@/lib/server/adminUserActions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt oder ist ungültig.", 500);

  try {
    const requester = await getVerifiedUser(request, admin);
    if (!requester) return jsonError("Kein Zugriff. Bitte erneut einloggen.", 401);

    await deleteOwnAccount(admin, requester.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminActionError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : "Account konnte nicht gelöscht werden.", 500);
  }
}
