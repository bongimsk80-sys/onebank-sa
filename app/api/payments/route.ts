import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const payments = await prisma.payment.findMany({
      where: {
        ...(status && status !== "all" ? { status } : {}),
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const payment = await prisma.payment.create({
      data: {
        beneficiary: data.beneficiary,
        bank: data.bank,
        amount: data.amount,
        type: data.type,
        status: data.isScheduled ? "scheduled" : "pending",
        initiatedBy: data.initiatedBy,
        reference: data.reference,
        description: data.description ?? "",
        priority: data.priority ?? false,
        isScheduled: data.isScheduled ?? false,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
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


    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(rejectionReason
          ? { description: `REJECTED: ${rejectionReason}` }
          : {}),
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `Payment of ${new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(payment.amount)} to ${payment.beneficiary} was ${status}`,
        entityType: "payment",
        entityId: payment.id,
        status: status === "rejected" ? "failed" : "success",
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
        },
      });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}