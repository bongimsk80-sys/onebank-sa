import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const UpdateAccountSchema = z.object({
  isActive: z.boolean().optional(),
  balance: z.number().min(0).max(1000000000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }
    const { id } = parsedParams.data;
    const body = await request.json();
    const result = UpdateAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const account = await prisma.bankAccount.update({
      where: { id, ...(orgId ? { organisationId: orgId } : {}) },
      data: {
        ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
        ...(data.balance !== undefined ? { balance: data.balance } : {}),
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }
    const { id } = parsedParams.data;
    await prisma.bankAccount.delete({
      where: { id, ...(orgId ? { organisationId: orgId } : {}) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
