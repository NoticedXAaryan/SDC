import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { broadcastAnnouncement } from "@/lib/services/announcements";
import { createAnnouncementSchema } from "@/lib/validators/announcements";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireRole(["lead", "admin", "owner"]);
  const input = createAnnouncementSchema.parse(await req.json());
  const announcement = await broadcastAnnouncement(session, input);

  return NextResponse.json(
    {
      success: true,
      message: `Broadcast queued for ${announcement.recipientCount} members`,
      communicationId: announcement.id,
    },
    { status: 201 },
  );
});
