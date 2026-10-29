import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, resolveOrgId, requireMfa } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { availableProviders } from "@/lib/connectors";
import { buildStitchAuthorizeUrl } from "@/lib/connectors/stitch";
import { yodleeUserToken } from "@/lib/connectors/yodlee";
import { seal } from "@/lib/secure-crypto";
import { syncConnection, storeTokens } from "@/lib/connectors/sync";

const CONSENT_DAYS = 90;

const CreateSchema = z.object({
  provider: z.enum(["simulated", "stitch", "yodlee"]),
  bank: z.string().max(50).optional(),       // simulated only
  consent: z.literal(true),                  // the admin ticked the consent box
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  const connections = await prisma.bankConnection.findMany({
    where: { organisationId: orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, provider: true, status: true, label: true, lastSyncedAt: true, lastError: true,
      consentGrantedAt: true, consentExpiresAt: true, revokedAt: true, createdAt: true,
      _count: { select: { accounts: true } },
    },
  });

  return NextResponse.json({ connections, providers: availableProviders() });
}

export async function POST(req: NextRequest) {
  const csrf = validateCsrf(req);
  if (csrf) return csrf;
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const mfa = await requireMfa(session);
  if (mfa) return mfa;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });
  const user = session.user as any;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input — consent is required.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { provider, bank } = parsed.data;
  const enabled = availableProviders().find((p) => p.id === provider);
  if (!enabled?.enabled) return NextResponse.json({ error: enabled?.reason ?? "Provider not available." }, { status: 400 });

  const consent = {
    consentGrantedAt: new Date(),
    consentGrantedById: user.id as string,
    consentExpiresAt: new Date(Date.now() + CONSENT_DAYS * 864e5),
  };

  try {
    if (provider === "simulated") {
      const conn = await prisma.bankConnection.create({
        data: { provider, label: bank ?? null, status: "pending", organisationId: orgId, ...consent },
      });
      await prisma.activityLog.create({
        data: { action: "Bank Connected", description: `Demo data connection created (${bank ?? "random bank"})`, userId: user.id, userName: user.name, entityType: "bank_connection", entityId: conn.id, organisationId: orgId },
      });
      const result = await syncConnection(conn.id, orgId, { id: user.id, name: user.name });
      return NextResponse.json({ connection: { id: conn.id }, result }, { status: 201 });
    }

    if (provider === "stitch") {
      const { url, state, nonce, codeVerifier } = buildStitchAuthorizeUrl();
      await prisma.connectionAuthState.create({
        data: {
          state, nonce, provider, codeVerifierEnc: seal(codeVerifier),
          userId: user.id, organisationId: orgId, expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      });
      return NextResponse.json({ redirectUrl: url });
    }

    // yodlee: create the connection now; the FastLink widget links accounts with this token.
    const conn = await prisma.bankConnection.create({
      data: { provider, status: "pending", organisationId: orgId, ...consent },
    });
    const tokens = await yodleeUserToken(conn.id);
    await prisma.bankConnection.update({ where: { id: conn.id }, data: storeTokens(tokens) });
    return NextResponse.json({
      connection: { id: conn.id },
      fastlink: { url: process.env.YODLEE_FASTLINK_URL, accessToken: tokens.accessToken },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Could not start the connection." }, { status: 502 });
  }
}
