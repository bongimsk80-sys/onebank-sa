import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgId, resolveOrgId, requireMfa } from "@/lib/api-auth";
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
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

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
      where: { id, organisationId: orgId },
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
        organisationId: orgId,
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
  const mfa = await requireMfa(session);
  if (mfa) return mfa;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

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
      where: { id, organisationId: orgId },
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
