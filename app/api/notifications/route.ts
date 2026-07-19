import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    throw new AuthorizationError("Unauthorized");
  }

  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });

  return NextResponse.json(userNotifications);
});

const markReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    throw new AuthorizationError("Unauthorized");
  }

  const body = await req.json();
  const parsed = markReadSchema.parse(body);

  if (parsed.notificationIds.length === 0) {
    return NextResponse.json({ message: "No notifications to update" });
  }

  await db.update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        inArray(notifications.id, parsed.notificationIds)
      )
    );

  return NextResponse.json({ message: "Notifications marked as read" });
});
