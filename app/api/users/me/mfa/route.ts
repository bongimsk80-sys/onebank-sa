import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { seal, open } from "@/lib/secure-crypto";

authenticator.options = { window: 1 };

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setup") }),
  z.object({ action: z.literal("enable"), code: z.string().min(6).max(8) }),
  z.object({ action: z.literal("disable"), code: z.string().min(6).max(8) }),
]);

const PRIVILEGED = ["admin", "approver", "executor"];

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { mfaEnabledAt: true, role: true } });
  return NextResponse.json({
    enabled: Boolean(user?.mfaEnabledAt),
    enabledAt: user?.mfaEnabledAt ?? null,
    required: PRIVILEGED.includes(user?.role ?? "") && process.env.REQUIRE_MFA !== "false",
  });
}

export async function POST(req: NextRequest) {
  const csrf = validateCsrf(req);
  if (csrf) return csrf;
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const s = session.user as any;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const body = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: s.id }, select: { email: true, role: true, mfaSecretEnc: true, mfaEnabledAt: true, organisationId: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "setup") {
    if (user.mfaEnabledAt) return NextResponse.json({ error: "Two-factor authentication is already on." }, { status: 409 });
    const secret = authenticator.generateSecret();
    await prisma.user.update({ where: { id: s.id }, data: { mfaSecretEnc: seal(secret) } });
    const uri = authenticator.keyuri(user.email, "OneView", secret);
    return NextResponse.json({ secret, qr: await QRCode.toDataURL(uri) });
  }

  if (!user.mfaSecretEnc) return NextResponse.json({ error: "Start setup first." }, { status: 400 });
  const valid = authenticator.verify({ token: body.code.replace(/\s/g, ""), secret: open(user.mfaSecretEnc) });
  if (!valid) return NextResponse.json({ error: "That code is not valid. Try the latest code." }, { status: 400 });

  if (body.action === "enable") {
    await prisma.user.update({ where: { id: s.id }, data: { mfaEnabledAt: new Date() } });
  } else {
    if (PRIVILEGED.includes(user.role) && process.env.REQUIRE_MFA !== "false") {
      return NextResponse.json({ error: "Your role requires two-factor authentication." }, { status: 403 });
    }
    await prisma.user.update({ where: { id: s.id }, data: { mfaEnabledAt: null, mfaSecretEnc: null } });
  }

  await prisma.activityLog.create({
    data: {
      action: body.action === "enable" ? "MFA Enabled" : "MFA Disabled",
      description: `${s.name} ${body.action === "enable" ? "enabled" : "disabled"} two-factor authentication`,
      userId: s.id, userName: s.name, entityType: "user", entityId: s.id,
      ipAddress: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
      organisationId: user.organisationId,
    },
  });
  return NextResponse.json({ enabled: body.action === "enable" });
}
