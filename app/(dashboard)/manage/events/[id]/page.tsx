import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";

/**
 * Compatibility route for old bookmarks and notifications.
 * Event management now lives under the canonical slug-based workspace.
 */
export default async function LegacyManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  const [event] = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!event) notFound();

  redirect(`/events/${event.slug}/manage`);
}
