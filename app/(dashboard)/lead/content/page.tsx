import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { contentItems, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ContentBoard } from "./components/content-board";

export default async function ContentCalendarPage() {
  await requireRole(["content_lead", "lead", "admin", "owner"]);

  const items = await db.select({
    content: contentItems,
    author: { name: user.name }
  })
  .from(contentItems)
  .leftJoin(user, eq(contentItems.authorId, user.id))
  .orderBy(desc(contentItems.createdAt));

  return (
    <div className="max-w-7xl mx-auto py-12 space-y-8">
      <ContentBoard initialItems={items} />
    </div>
  );
}
