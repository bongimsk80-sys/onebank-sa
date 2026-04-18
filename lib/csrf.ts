import { NextRequest, NextResponse } from "next/server";

/**
 * C9 — CSRF protection for hand-rolled API routes.
 *
 * Why this works for JSON-only endpoints:
 * Browsers enforce the Same-Origin Policy for cross-origin requests with a
 * non-simple Content-Type (application/json). A malicious third-party site
 * cannot send application/json POST requests to your API without a CORS
 * preflight — and we don't grant cross-origin access, so the preflight fails
 * before the request body reaches the handler.
 *
 * We additionally validate the Origin header so that even if a browser quirk
 * or misconfigured CORS policy were ever introduced, the check still holds.
 *
 * Usage — call at the top of any public auth POST handler:
 *   const csrfError = validateCsrf(req);
 *   if (csrfError) return csrfError;
 */
export function validateCsrf(req: NextRequest): NextResponse | null {
  // 1. Require application/json — blocks HTML-form and multipart CSRF vectors.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Unsupported content type." },
      { status: 415 }
    );
  }

  // 2. Validate Origin header against the configured app URL.
  //    Requests from the same origin have a matching Origin; requests from
  //    server-side callers (curl, Postman, trusted integrations) have no Origin
  //    and are permitted — only explicit cross-origin browser requests are blocked.
  const origin = req.headers.get("origin");
  if (origin) {
    const allowed = getAllowedOrigins();
    const reqOrigin = normaliseOrigin(origin);
    if (!allowed.includes(reqOrigin)) {
      return NextResponse.json(
        { error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }
  }

  return null; // passes
}

function normaliseOrigin(raw: string): string {
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return raw;
  }
}

function getAllowedOrigins(): string[] {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  // Always allow localhost in non-production
  const origins = [normaliseOrigin(base)];
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return origins;
}
