import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const UpdateBeneficiarySchema = z.object({
  tag: z.string().min(1).max(50).optional(),
  status: z.string().min(1).max(50).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
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

    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id, ...(orgId ? { organisationId: orgId } : {}) },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: "Beneficiary not found" },
        { status: 404 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: {
        beneficiary: beneficiary.name,
        ...(orgId ? { organisationId: orgId } : {}),
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    return NextResponse.json({ beneficiary, payments });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch beneficiary" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
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
    const result = UpdateBeneficiarySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const beneficiary = await prisma.beneficiary.update({
      where: { id, ...(orgId ? { organisationId: orgId } : {}) },
      data: {
        ...(data.tag ? { tag: data.tag } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });

    return NextResponse.json({ beneficiary });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update beneficiary" },
      { status: 500 }
    );
  }
}
