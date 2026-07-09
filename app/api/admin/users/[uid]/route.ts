import { NextResponse } from "next/server";
import { getAdmin, getRequester, jsonError } from "@/lib/server/adminAuth";
import { AdminActionError, applyRoleChange, removeUserAccount } from "@/lib/server/adminUserActions";
import type { UserRole } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ uid: string }> }) {
  const admin = getAdmin();
  if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt in Vercel.", 500);

  try {
    const requester = await getRequester(request, admin);
    if (!requester) return jsonError("Kein Zugriff.", 403);

    const { uid } = await context.params;
    const body = (await request.json()) as { role?: UserRole };
    const nextRole = body.role;
    if (nextRole !== "user" && nextRole !== "admin" && nextRole !== "developer") {
      return jsonError("Ungültige Rolle.", 400);
    }

    const role = await applyRoleChange(admin, requester, uid, nextRole);
    return NextResponse.json({ ok: true, role });
  } catch (error) {
    if (error instanceof AdminActionError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : "Rolle konnte nicht geändert werden.", 500);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ uid: string }> }) {
  const admin = getAdmin();
  if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt in Vercel.", 500);

  try {
    const requester = await getRequester(request, admin);
    if (!requester) return jsonError("Kein Zugriff.", 403);

    const { uid } = await context.params;
    await removeUserAccount(admin, requester, uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminActionError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : "Nutzer konnte nicht gelöscht werden.", 500);
  }
}
