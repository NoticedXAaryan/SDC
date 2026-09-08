import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requirePageSession } from "@/lib/dal/auth";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await requirePageSession("/settings");
  const [identity] = await db.select({ username: user.username, requestedUsername: user.requestedUsername, role: user.role })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!identity) return null;
  return <SettingsClient identity={identity} />;
}
