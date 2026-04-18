import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";
import { recordRealTimeMetric } from "@/lib/metrics";

const PaymentSchema = z.object({
  amount: z.number().positive().max(10000000),
  beneficiary: z.string().min(1).max(100),
  reference: z.string().min(1).max(50),
  bank: z.string().min(1),
  type: z.string().min(1),
  initiatedBy: z.string().min(1).max(100),
  description: z.string().optional(),
  priority: z.boolean().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
});

const UpdatePaymentSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  rejectionReason: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const { searchParams } = new URL(request.url);
    const status   = searchParams.get("status");
    const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
    const skip     = (page - 1) * pageSize;

    const where = {
      ...(orgId ? { organisationId: orgId } : {}),
      ...(status && status !== "all" ? { status } : {}),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { date: "desc" }, skip, take: pageSize }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId  = await resolveOrgId(session);
  const userId = (session.user as any).id as string;
  const role   = (session.user as any).role as string;
  const userName = (session.user as any).name as string;

  try {
    const body = await request.json();
    const result = PaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // ── H5: Enforce per-transaction transfer limit ─────────────────────────���
    if (orgId) {
      const limit = await prisma.transferLimit.findFirst({
        where: { organisationId: orgId, role, isActive: true },
        select: { perTxLimit: true },
      });
      if (limit && data.amount > limit.perTxLimit) {
        const fmt = (n: number) =>
          new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);
        return NextResponse.json(
          {
            error: `Amount ${fmt(data.amount)} exceeds your per-transaction limit of ${fmt(limit.perTxLimit)}.`,
          },
          { status: 403 }
        );
      }
    }

    // ── Create payment ───────────────────────────────────────────────────────
    const payment = await prisma.payment.create({
      data: {
        beneficiary:   data.beneficiary,
        bank:          data.bank,
        amount:        data.amount,
        type:          data.type,
        status:        data.isScheduled ? "scheduled" : "pending",
        initiatedBy:   data.initiatedBy,
        initiatorId:   userId,
        reference:     data.reference,
        description:   data.description ?? "",
        priority:      data.priority ?? false,
        isScheduled:   data.isScheduled ?? false,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });

    // ── H3: Audit log payment creation ──────────────────────────────────────
    await prisma.activityLog.create({
      data: {
        action:      "Payment Created",
        description: `${userName} initiated a payment of ${new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(data.amount)} to ${data.beneficiary}`,
        userId,
        userName,
        entityType:  "payment",
        entityId:    payment.id,
        status:      "success",
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin", "approver"]);
  if (session instanceof NextResponse) return session;
  const orgId    = await resolveOrgId(session);
  const userId   = (session.user as any).id as string;
  const userName = (session.user as any).name as string;

  try {
    const body = await request.json();
    const result = UpdatePaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { id, status, rejectionReason } = result.data;

    // H6: Prevent self-approval — fetch the payment to check who initiated it
    const existing = await prisma.payment.findFirst({
      where: { id, ...(orgId ? { organisationId: orgId } : {}) },
      select: { initiatorId: true, initiatedBy: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    if (
      (status === "approved" || status === "settled") &&
      existing.initiatorId &&
      existing.initiatorId === userId
    ) {
      return NextResponse.json(
        { error: "You cannot approve a payment you initiated." },
        { status: 403 }
      );
    }

    const payment = await prisma.payment.update({
      where: { id, ...(orgId ? { organisationId: orgId } : {}) },
      data: {
        status,
        ...(rejectionReason
          ? { description: `REJECTED: ${rejectionReason}` }
          : {}),
      },
    });

    // H3: Audit log payment status change
    await prisma.activityLog.create({
      data: {
        action:      `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `${userName} ${status} payment of ${new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(payment.amount)} to ${payment.beneficiary}`,
        userId,
        userName,
        entityType:  "payment",
        entityId:    payment.id,
        status:      status === "rejected" ? "failed" : "success",
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });

    // Auto-create notification based on status
    const notificationMap: Record<string, { title: string; message: string; type: string }> = {
      approved: {
        title: "Payment Approved",
        message: `Payment to ${payment.beneficiary} of ${new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(payment.amount)} has been approved.`,
        type: "success",
      },
      rejected: {
        title: "Payment Rejected",
        message: `Payment to ${payment.beneficiary} was rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ""}`,
        type: "error",
      },
      settled: {
        title: "Payment Settled",
        message: `Payment to ${payment.beneficiary} of ${new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(payment.amount)} has been settled successfully.`,
        type: "success",
      },
      inprogress: {
        title: "Payment In Progress",
        message: `Payment to ${payment.beneficiary} is now being executed.`,
        type: "info",
      },
    };

    if (notificationMap[status]) {
      await prisma.notification.create({
        data: {
          ...notificationMap[status],
          link: "/payments",
          ...(orgId ? { organisationId: orgId } : {}),
        },
      });
    }

    // Auto-create a Transaction record so the payment appears in the
    // Transactions ledger and Recent Transactions on the Overview.
    if (status === "settled") {
      await prisma.transaction.create({
        data: {
          name:          payment.beneficiary,
          type:          payment.type,
          amount:        -Math.abs(payment.amount), // debit (outgoing)
          bank:          payment.bank,
          accountNumber: "N/A",
          reference:     payment.reference,
          status:        "completed",
          date:          new Date(),
          ...(orgId ? { organisationId: orgId } : {}),
        },
      });
    }

    await recordRealTimeMetric({
      type: "payment",
      amount: payment.amount,
      bank: payment.bank,
      status: body.status,
    });

    return NextResponse.json({ payment });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
