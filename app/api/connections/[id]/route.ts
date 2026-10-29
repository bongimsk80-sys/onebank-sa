import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, resolveOrgId, requireMfa } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { syncConnection } from "@/lib/connectors/sync";

const Params = z.object({ id: z.string().min(1) });

/** POST = sync now. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = validateCsrf(req);
  if (csrf) return csrf;
  const session = await requireRole(["admin", "approver", "reviewer"]);
  if (session instanceof NextResponse) return session;
  const mfa = await requireMfa(session);
  if (mfa) return mfa;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });
  const p = Params.safeParse(await params);
  if (!p.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const user = session.user as any;
    const result = await syncConnection(p.data.id, orgId, { id: user.id, name: user.name });
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Sync failed" }, { status: 502 });
  }
}

/** DELETE = revoke consent: wipe tokens, stop syncing, hide its accounts. History is kept for audit. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const mfa = await requireMfa(session);
  if (mfa) return mfa;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });
  const p = Params.safeParse(await params);
  if (!p.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const conn = await prisma.bankConnection.findFirst({ where: { id: p.data.id, organisationId: orgId } });
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.bankConnection.update({
      where: { id: conn.id },
      data: { status: "revoked", revokedAt: new Date(), accessTokenEnc: null, refreshTokenEnc: null, tokenExpiresAt: null },
    }),
    prisma.bankAccount.updateMany({ where: { connectionId: conn.id, organisationId: orgId }, data: { isActive: false } }),
  ]);
  const user = session.user as any;
  await prisma.activityLog.create({
    data: { action: "Bank Consent Revoked", description: `${conn.provider} connection revoked`, userId: user.id, userName: user.name, entityType: "bank_connection", entityId: conn.id, organisationId: orgId },
  });
  return NextResponse.json({ ok: true });
}
