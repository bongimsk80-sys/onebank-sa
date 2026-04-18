import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const CreateAccountSchema = z.object({
  bank: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  accountType: z.string().min(1).max(50),
  balance: z.number().min(0).max(1000000000).optional(),
  color: z.string().min(1).max(20),
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { ...(orgId ? { organisationId: orgId } : {}) },
      orderBy: { bank: "asc" },
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = CreateAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const account = await prisma.bankAccount.create({
      data: {
        bank: data.bank,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        balance: data.balance ?? 0,
        currency: "ZAR",
        color: data.color,
        isActive: true,
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
