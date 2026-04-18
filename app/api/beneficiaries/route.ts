import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const CreateBeneficiarySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  status: z.string().min(1).max(50).optional(),
  accountNumber: z.string().min(1).max(50),
  bank: z.string().min(1).max(100),
  branchCode: z.string().min(1).max(20),
  tag: z.string().min(1).max(50).optional(),
});

const DeleteBeneficiarySchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const { searchParams } = new URL(request.url);
    const status   = searchParams.get("status") ?? "active";
    const type     = searchParams.get("type");
    const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "100", 10)));
    const skip     = (page - 1) * pageSize;

    const where = {
      ...(orgId ? { organisationId: orgId } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(type && type !== "all" ? { type } : {}),
    };

    const [beneficiaries, total] = await Promise.all([
      prisma.beneficiary.findMany({ where, orderBy: { totalPayments: "desc" }, skip, take: pageSize }),
      prisma.beneficiary.count({ where }),
    ]);

    return NextResponse.json({
      beneficiaries,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch beneficiaries" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = DeleteBeneficiarySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.beneficiary.delete({
      where: { id: result.data.id, ...(orgId ? { organisationId: orgId } : {}) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete beneficiary" },
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
    const result = CreateBeneficiarySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const beneficiary = await prisma.beneficiary.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        status: data.status ?? "active",
        accountNumber: data.accountNumber,
        bank: data.bank,
        branchCode: data.branchCode,
        totalPayments: 0,
        lastPayment: 0,
        tag: data.tag ?? "General",
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });
    return NextResponse.json({ beneficiary }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create beneficiary" },
      { status: 500 }
    );
  }
}
