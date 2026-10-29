import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { sendLgWaitlistNotification } from "@/lib/email";
import { validateCsrf } from "@/lib/csrf";

// POST /api/lg-waitlist — authenticated users only
export async function POST(req: NextRequest) {
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const session = sessionOrError;
  const userId  = (session.user as any).id as string;

  try {
    const body   = await req.json();
    const lgType = (body?.lgType ?? "").trim();

    if (!lgType) {
      return NextResponse.json(
        { error: "Please select an LG type." },
        { status: 400 }
      );
    }

    // Fetch user + org for the notification email
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: {
        name:  true,
        email: true,
        organisation: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Log to ActivityLog so the team can see demand per org
    await prisma.activityLog.create({
      data: {
        action:      "LG_WAITLIST_JOIN",
        description: `Joined LG waitlist — interested in: ${lgType}`,
        userId,
        userName:    user.name,
        entityType:  "LgWaitlist",
        status:      "pending",
        ...(user.organisation ? { organisationId: user.organisation.id } : {}),
      },
    });

    // Notify the OneView team (fire-and-forget)
    sendLgWaitlistNotification({
      userName:  user.name,
      userEmail: user.email,
      orgName:   user.organisation?.name ?? "Unknown",
      lgType,
      joinedAt:  new Date(),
    }).catch((err) => {
      console.error("[lg-waitlist] Email notification failed:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[lg-waitlist] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
