import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotificationService } from "@/lib/services/notifications";

const approveSchema = z.object({
  userId: z.string(),
  approve: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only leads, admins, owners can approve
    const allowedRoles = ["lead", "admin", "owner"];
    if (!allowedRoles.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = approveSchema.parse(body);

    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, parsed.userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsed.approve) {
      // Using better-auth admin plugin to set role
      await (auth.api as any).setRole({
        body: {
          userId: parsed.userId,
          role: "member",
        },
        headers: req.headers,
      });

      // Send notification
      await NotificationService.sendInAppNotification({
        userId: parsed.userId,
        type: "system",
        title: "Application Approved",
        message: "Welcome to the club! You are now a full member.",
      });

      return NextResponse.json({ message: "User approved successfully" });
    } else {
      // Reject application
      await NotificationService.sendInAppNotification({
        userId: parsed.userId,
        type: "system",
        title: "Application Status",
        message: "Your application is currently under further review or has been declined.",
      });
      return NextResponse.json({ message: "User rejected" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
