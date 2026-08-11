import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

import { checkInScanner } from "@/lib/dal/scanner";

export const POST = withApiHandler(async (req: Request) => {
  const session = await requireRole(["owner", "admin", "lead", "co_lead", "volunteer_lead"]);

  const body = await req.json();
  const { token, eventId, scannedFaceDescriptor } = body;

  if (!token || !eventId) {
    throw new ValidationError("Missing token or eventId");
  }

  const result = await checkInScanner(session, eventId, token, scannedFaceDescriptor);
  return NextResponse.json(result);
});
