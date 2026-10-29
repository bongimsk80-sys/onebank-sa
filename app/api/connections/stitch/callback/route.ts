import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { open } from "@/lib/secure-crypto";
import { exchangeStitchCode } from "@/lib/connectors/stitch";
import { storeTokens, syncConnection } from "@/lib/connectors/sync";

const CONSENT_DAYS = 90;

function back(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/settings/bank-accounts", req.nextUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

/** Stitch redirects here after the customer authorises access at their bank. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  if (error) return back(req, { connectError: error });
  if (!code || !state) return back(req, { connectError: "missing_code" });

  const pending = await prisma.connectionAuthState.findUnique({ where: { state } });
  // single use: remove regardless of outcome
  if (pending) await prisma.connectionAuthState.delete({ where: { id: pending.id } }).catch(() => {});
  if (!pending || pending.expiresAt < new Date() || pending.provider !== "stitch") {
    return back(req, { connectError: "expired_or_invalid_state" });
  }

  // The browser that finishes the flow must be the user who started it.
  const session = await auth();
  if (!session || (session.user as any).id !== pending.userId) {
    return back(req, { connectError: "session_mismatch" });
  }

  try {
    const tokens = await exchangeStitchCode(code, open(pending.codeVerifierEnc));
    const conn = await prisma.bankConnection.create({
      data: {
        provider: "stitch",
        status: "pending",
        organisationId: pending.organisationId,
        consentGrantedAt: new Date(),
        consentGrantedById: pending.userId,
        consentExpiresAt: new Date(Date.now() + CONSENT_DAYS * 864e5),
        ...storeTokens(tokens),
      },
    });
    await prisma.activityLog.create({
      data: {
        action: "Bank Connected",
        description: `Stitch connection authorised (scopes: ${tokens.scopes ?? "n/a"})`,
        userId: pending.userId,
        userName: (session.user as any).name,
        entityType: "bank_connection",
        entityId: conn.id,
        organisationId: pending.organisationId,
      },
    });
    const result = await syncConnection(conn.id, pending.organisationId, { id: pending.userId, name: (session.user as any).name });
    return back(req, { connected: "stitch", accounts: String(result.accounts) });
  } catch (err: any) {
    return back(req, { connectError: String(err?.message ?? "stitch_failed").slice(0, 120) });
  }
}
