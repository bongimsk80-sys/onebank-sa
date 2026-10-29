import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

/**
 * Demo-request form on the marketing website (a different origin) posts here.
 * Only origins listed in MARKETING_ORIGINS (comma-separated) may call it.
 * Admins read enquiries with GET.
 */

const Schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().min(1).max(160),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  banks: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consentProcessing: z.literal(true),
  consentMarketing: z.boolean().optional(),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

function allowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  // Default: the live marketing site. Override with MARKETING_ORIGINS (comma-separated).
  const allowed = (process.env.MARKETING_ORIGINS ?? "https://onebank-sa.netlify.app").split(",").map((s) => s.trim()).filter(Boolean);
  return origin && allowed.includes(origin) ? origin : null;
}

function cors(origin: string | null): Record<string, string> {
  return origin
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

// simple per-IP throttle for the public form (in-memory; per server instance)
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(allowedOrigin(req)) });
}

export async function POST(req: NextRequest) {
  const origin = allowedOrigin(req);
  if (!origin) return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  const headers = cors(origin);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (throttled(ip)) return NextResponse.json({ error: "Too many requests — please try again later." }, { status: 429, headers });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the required fields and accept the privacy notice.", fields: parsed.error.flatten().fieldErrors }, { status: 400, headers });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }, { status: 201, headers }); // bot: pretend success

  await prisma.enquiry.create({
    data: {
      firstName: d.firstName, lastName: d.lastName, email: d.email.toLowerCase(),
      phone: d.phone || null, company: d.company, role: d.role || null, banks: d.banks || null,
      message: d.message || null, consentProcessing: true, consentMarketing: d.consentMarketing ?? false,
      ipAddress: ip,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201, headers });
}

export async function GET() {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  // Enquiries are platform-level leads; only platform staff should see them.
  const staff = (process.env.PLATFORM_ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase());
  if (!staff.includes(String((session.user as any).email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ enquiries });
}
