// Rate limiting is only active in production with Upstash configured
// Falls back gracefully in local development

const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!isUpstashConfigured) {
    // Allow all requests in local development
    return true;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
    });

    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch (error) {
    console.warn("Rate limit check failed, allowing request:", error);
    return true;
  }
}
