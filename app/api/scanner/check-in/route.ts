import { NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";

import { ScannerService } from "@/lib/services/scanner";
import { EVENT_SCANNER_ROLES } from "@/lib/dal/event-access";
import { z } from "zod";

const checkInSchema = z.object({
  token: z.string().min(1).max(4096),
  eventId: z.string().min(1).max(200),
}).strict();

export const POST = withApiHandler(async (req: Request) => {
    
    
  const session = await requireRole([...EVENT_SCANNER_ROLES]);

  const parsed = checkInSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new ValidationError("Invalid check-in payload");
  const { token, eventId } = parsed.data;

  const result = await ScannerService.checkInScanner(session, eventId, token);
  return NextResponse.json(result);
});
