// Rate limiting — active in production when Upstash Redis is configured.
// Falls back gracefully (allows all) in local development.

const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

type Window = `${number} s` | `${number} m` | `${number} h`;

async function limit(
  identifier: string,
  requests: number,
  window: Window
): Promise<boolean> {
  if (!isUpstashConfigured) return true;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis }     = await import("@upstash/redis");

    const ratelimit = new Ratelimit({
      redis:   Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(requests, window),
    });

    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch (err) {
    console.warn("[rate-limit] check failed, allowing request:", err);
    return true;
  }
}

/**
 * General API rate limit — 60 requests / minute per identifier.
 * Used for authenticated data endpoints.
 */
export function checkRateLimit(identifier: string): Promise<boolean> {
  return limit(identifier, 60, "1 m");
}

/**
 * Strict auth rate limit — 5 attempts / minute per identifier.
 * Use on all public auth endpoints: register, login, forgot-password,
 * reset-password, verify-email, accept-invite.
 *
 * Pass `ip:email` as the identifier to limit per (IP, email) pair,
 * or just `ip` when no email is available.
 */
export function checkAuthRateLimit(identifier: string): Promise<boolean> {
  return limit(`auth:${identifier}`, 5, "1 m");
}
