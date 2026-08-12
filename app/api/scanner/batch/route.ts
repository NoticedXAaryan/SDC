import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

import { ScannerService } from "@/lib/services/scanner";

export const POST = withApiHandler(async (req: Request) => {
  const session = await requireRole(["owner", "admin", "lead", "co_lead", "volunteer_lead"]);

  const body = await req.json();
  const { checkIns } = body;

  const result = await ScannerService.batchCheckInScanner(session, checkIns);
  return NextResponse.json(result);
});
