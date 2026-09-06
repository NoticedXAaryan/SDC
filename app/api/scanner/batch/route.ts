import { NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";

import { ScannerService } from "@/lib/services/scanner";
import { EVENT_SCANNER_ROLES } from "@/lib/dal/event-access";
import { z } from "zod";

const batchSchema = z.object({
  checkIns: z.array(z.object({
    id: z.string().min(1).max(200),
    token: z.string().min(1).max(4096),
    eventId: z.string().min(1).max(200),
  }).strict()).min(1).max(500),
}).strict();

export const POST = withApiHandler(async (req: Request) => {
    
    
  const session = await requireRole([...EVENT_SCANNER_ROLES]);

  const parsed = batchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new ValidationError("Invalid batch check-in payload");
  const { checkIns } = parsed.data;

  const result = await ScannerService.batchCheckInScanner(session, checkIns);
  return NextResponse.json(result);
});
