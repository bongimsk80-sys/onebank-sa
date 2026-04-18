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

  // 2. Validate Origin against the request's own Host header.
  //
  //    Same-origin requests (browser → its own API) pass because Origin and
  //    Host share the same hostname. Requests from server-side callers (curl,
  //    Postman, internal services) have no Origin header and are also permitted.
  //    Only explicit cross-origin browser requests are blocked.
  //
  //    Using Host rather than NEXTAUTH_URL makes this work across every Vercel
  //    deployment URL (production, preview, branch) without extra configuration.
  const origin = req.headers.get("origin");
  if (origin) {
    const allowed = getAllowedOrigins(req);
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

function getAllowedOrigins(req: NextRequest): string[] {
  const origins: string[] = [];

  // Primary: derive from the incoming Host header — always matches same-origin
  // requests regardless of deployment URL.
  const host = req.headers.get("host");
  if (host) {
    const isLocal = host.startsWith("localhost") || host.startsWith("127.");
    origins.push(`${isLocal ? "http" : "https"}://${host}`);
  }

  // Secondary: honour the explicitly configured app URL if present
  const configured =
    process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    const norm = normaliseOrigin(configured);
    if (!origins.includes(norm)) origins.push(norm);
  }

  // Development convenience
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return origins;
}
