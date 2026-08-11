import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { exportEventAttendees } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireSession();
  const { id } = await params;

  const result = await exportEventAttendees(session, id);

  return new NextResponse(result.csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="event-${result.eventSlug}-attendees.csv"`,
    },
  });
}, { requireRateLimit: false });

