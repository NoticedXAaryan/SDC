import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Re-export AuthorizationError from its canonical source so existing imports keep working
export { AuthorizationError } from "@/lib/dal/auth";
import { AuthorizationError } from "@/lib/dal/auth";

export class ValidationError extends Error {
  constructor(message: string = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

type ApiHandler<T = any> = (
  req: NextRequest,
  ctx: any
) => Promise<NextResponse<T>> | NextResponse<T>;

export interface ApiHandlerOptions {
  requireRateLimit?: boolean;
  rateLimitPrefix?: string;
}

export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = { requireRateLimit: true }
) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const h = await headers();
      const session = await auth.api.getSession({ headers: h });
      
      if (session && !session.user.emailVerified) {
        return NextResponse.json({ error: "Verify email first", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
      }

      // 1. Rate Limiting (applied to mutating requests by default)
      if (options.requireRateLimit !== false) {
        const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
        if (isMutating) {
          const rl = await checkRateLimit(req, options.rateLimitPrefix || req.nextUrl.pathname);
          if (!rl.success) {
            const status = rl.error === "Service temporarily unavailable" ? 503 : 429;
            return NextResponse.json(
              { error: rl.error || "Too many requests. Please try again later." },
              { status }
            );
          }
        }
      }

      // 2. Execute actual handler
      return await handler(req, ctx);
    } catch (error: any) {
      if (error instanceof AuthorizationError || error?.name === "AuthorizationError") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      if (error instanceof NotFoundError || error?.name === "NotFoundError") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error instanceof ValidationError || error?.name === "ZodError" || error?.name === "ValidationError") {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors || error.message },
          { status: 400 }
        );
      }

      // Log unexpected errors — never leak internals to client
      logger.error({ err: error, path: req.nextUrl.pathname }, "API Error");

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
