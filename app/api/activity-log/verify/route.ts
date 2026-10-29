import { NextResponse } from "next/server";
import { requireRole, resolveOrgId } from "@/lib/api-auth";
import { verifyAuditChain } from "@/lib/audit";

/** Admin check that the organisation's audit trail has not been altered. */
export async function GET() {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });
  return NextResponse.json(await verifyAuditChain(orgId));
}
