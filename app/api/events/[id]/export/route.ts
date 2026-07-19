import { NextRequest, NextResponse } from "next/server";
import { requireRole, getUserDomain } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireRole(["co_lead", "lead", "admin", "owner"]);
  const { id: eventId } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const isAdmin = ["admin", "owner"].includes(session.user.role as string);
  if (!isAdmin) {
    // If they are a lead, they can only export if the event matches their domain
    const userDomain = await getUserDomain(session.user.id, session.user.role as string);
    if (event.domain !== userDomain) {
      return NextResponse.json({ error: "Forbidden: Event is outside your domain" }, { status: 403 });
    }
  }

  const attendees = await db
    .select({
      name: user.name,
      email: user.email,
      branch: user.branch,
      year: user.year,
      status: registrations.status,
      checkedInAt: registrations.checkedInAt,
      attendanceMethod: registrations.attendanceMethod,
    })
    .from(registrations)
    .innerJoin(user, eq(registrations.userId, user.id))
    .where(eq(registrations.eventId, eventId));

  const csvContent = Papa.unparse(attendees);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="event-${event.slug}-attendees.csv"`,
    },
  });
}, { requireRateLimit: false });
