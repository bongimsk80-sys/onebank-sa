import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, resolveOrgId } from "@/lib/api-auth";

const CreateInvoiceSchema = z.object({
  erpProvider: z.string().min(1).max(50),
  invoiceNumber: z.string().min(1).max(50),
  vendor: z.string().min(1).max(100),
  amount: z.number().positive().max(10000000),
  dueDate: z.string().min(1),
  autoCreatePayment: z.boolean().optional(),
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  try {
    const invoices = await prisma.erpInvoice.findMany({
      where: { organisationId: orgId },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json({ invoices });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);
  if (!orgId) return NextResponse.json({ error: "No organisation associated with your account." }, { status: 403 });

  try {
    const body = await request.json();
    const result = CreateInvoiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const invoice = await prisma.erpInvoice.create({
      data: {
        erpProvider:   data.erpProvider,
        invoiceNumber: data.invoiceNumber,
        vendor:        data.vendor,
        amount:        data.amount,
        dueDate:       new Date(data.dueDate),
        status:        "pending",
        organisationId: orgId,
      },
    });

    if (data.autoCreatePayment) {
      const payment = await prisma.payment.create({
        data: {
          beneficiary:  data.vendor,
          bank:         "FNB",
          amount:       data.amount,
          type:         "local",
          status:       "pending",
          initiatedBy:  "ERP System",
          reference:    data.invoiceNumber,
          description:  `Auto-payment from ${data.erpProvider} invoice ${data.invoiceNumber}`,
          priority:     false,
          isScheduled:  false,
          organisationId: orgId,
        },
      });

      await prisma.erpInvoice.update({
        where: { id: invoice.id },
        data: {
          paymentId: payment.id,
          status:    "payment_created",
        },
      });
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}