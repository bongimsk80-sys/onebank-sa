import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { sendCloseAccountRequestToTeam, sendCloseAccountConfirmationToAdmin } from "@/lib/email";
import { validateCsrf } from "@/lib/csrf";

// POST /api/auth/close-account-request — admin only
export async function POST(req: NextRequest) {
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const sessionOrError = await requireRole(["admin"]);
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const session = sessionOrError;
  const userId  = (session.user as any).id as string;

  try {
    const body = await req.json();
    const { reason, details, confirmedOrgName } = body ?? {};

    if (!reason || !confirmedOrgName) {
      return NextResponse.json(
        { error: "Reason and organisation name confirmation are required." },
        { status: 400 }
      );
    }

    // Fetch user + org details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        organisation: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!user || !user.organisation) {
      return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
    }

    // Confirm the admin typed the correct org name
    if (confirmedOrgName.trim().toLowerCase() !== user.organisation.name.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Organisation name does not match. Please check and try again." },
        { status: 422 }
      );
    }

    const submittedAt = new Date();

    // Log to ActivityLog so it appears in the audit trail
    await prisma.activityLog.create({
      data: {
        action:       "CLOSE_ACCOUNT_REQUEST",
        description:  `Account closure requested. Reason: ${reason}${details ? ` — ${details}` : ""}`,
        userId,
        userName:     user.name,
        entityType:   "Organisation",
        status:       "pending",
        organisationId: user.organisation.id,
      },
    });

    // Fire both emails concurrently — neither blocks the 200 response
    const emailPayload = {
      adminName:   user.name,
      adminEmail:  user.email,
      orgName:     user.organisation.name,
      orgSlug:     user.organisation.slug,
      reason,
      details:     details ?? "",
      submittedAt,
    };

    Promise.all([
      sendCloseAccountRequestToTeam(emailPayload),
      sendCloseAccountConfirmationToAdmin(emailPayload),
    ]).catch((err) => {
      console.error("[close-account-request] Email send failed:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[close-account-request] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
