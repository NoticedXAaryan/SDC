import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { markAttendance } from "@/lib/dal/events";

const attendanceSchema = z.object({
  passCode: z.string(),
});

export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) => {
  const sessionAuth = await requireSession();
  const { id: eventId, sessionId } = await params;
  
  const body = await req.json();
  const { passCode } = attendanceSchema.parse(body);

  const result = await markAttendance(sessionAuth, eventId, sessionId, passCode);
  return NextResponse.json(result);
});

