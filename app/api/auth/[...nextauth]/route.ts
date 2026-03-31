import { handlers } from "@/auth";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const GET = handlers.GET;

export async function POST(request: Request) {
	const pathname = new URL(request.url).pathname;

	if (pathname.endsWith("/callback/credentials")) {
		const forwardedFor = request.headers.get("x-forwarded-for");
		const realIp = request.headers.get("x-real-ip");
		const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "127.0.0.1";

		const success = await checkRateLimit(ip);
		if (!success) {
			return NextResponse.json(
				{ error: "Too many requests" },
				{ status: 429 }
			);
		}
	}

	return handlers.POST(request);
}