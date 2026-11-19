import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

// One-shot endpoint to run pending migrations from the Vercel runtime,
// which has network access to Neon that build machines lack.
// Protected by PLATFORM_METRICS_TOKEN (admin-only secret).
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = process.env.PLATFORM_METRICS_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
    const output = execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: dbUrl },
      encoding: "utf8",
      timeout: 30000,
    });
    return NextResponse.json({ ok: true, output });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      { ok: false, stdout: e.stdout, stderr: e.stderr, message: e.message },
      { status: 500 }
    );
  }
}
