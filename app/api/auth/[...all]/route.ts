import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);
export const GET = handler.GET;
export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api/auth", "");
  if (["/sign-up/email", "/sign-in/email", "/request-password-reset", "/send-verification-email"].includes(path)) {
    const limit = await checkRateLimit(request, `auth:${path}`);
    if (!limit.success) return NextResponse.json({ message: limit.error }, { status: limit.error === "Service temporarily unavailable" ? 503 : 429, headers: { "Retry-After": "60" } });
  }
  if (path === "/sign-up/email") {
    try {
      const body = await request.clone().json();
      if (body.website) return NextResponse.json({ message: "Unable to create account. Please try again." }, { status: 400 });
    } catch {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }
  }
  return handler.POST(request);
}
