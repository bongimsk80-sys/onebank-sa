import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const WorkflowStepSchema = z.object({
  role: z.string().min(1).max(50),
  order: z.number().int().positive(),
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  steps: z.array(WorkflowStepSchema).min(1),
});

const UpdateWorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(WorkflowStepSchema).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
});

const DeleteWorkflowSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const workflows = await prisma.approvalWorkflow.findMany({
      where: { ...(orgId ? { organisationId: orgId } : {}) },
      orderBy: { minAmount: "asc" },
    });
    return NextResponse.json({ workflows });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
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
    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        name: data.name,
        description: data.description ?? "",
        minAmount: data.minAmount ?? 0,
        maxAmount: data.maxAmount ?? 999999999,
        steps: JSON.stringify(data.steps),
        isActive: true,
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = UpdateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const workflow = await prisma.approvalWorkflow.update({
      where: { id: data.id, ...(orgId ? { organisationId: orgId } : {}) },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
        ...(data.steps ? { steps: JSON.stringify(data.steps) } : {}),
        ...(data.minAmount !== undefined ? { minAmount: data.minAmount } : {}),
        ...(data.maxAmount !== undefined ? { maxAmount: data.maxAmount } : {}),
      },
    });
    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update workflow" },
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
    const result = DeleteWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.approvalWorkflow.delete({
      where: { id: result.data.id, ...(orgId ? { organisationId: orgId } : {}) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
