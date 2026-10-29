import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId, requireMfa } from "@/lib/api-auth";
import { z } from "zod";

const UpdateTransferLimitSchema = z.object({
  id: z.string().min(1),
  dailyLimit: z.number().min(0),
  perTxLimit: z.number().min(0),
  monthlyLimit: z.number().min(0),
  isActive: z.boolean(),
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  try {
    const limits = await prisma.transferLimit.findMany({
      where: { organisationId: orgId },
      orderBy: { role: "asc" },
    });
    return NextResponse.json({ limits });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transfer limits" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const mfa = await requireMfa(session);
  if (mfa) return mfa;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  try {
    const body = await request.json();
    const result = UpdateTransferLimitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const limit = await prisma.transferLimit.update({
      where: { id: data.id, organisationId: orgId },
      data: {
        dailyLimit: data.dailyLimit,
        perTxLimit: data.perTxLimit,
        monthlyLimit: data.monthlyLimit,
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ limit });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update transfer limit" },
      { status: 500 }
    );
  }
}
