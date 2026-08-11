"use server";

import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";
import { revalidatePath } from "next/cache";

export async function updateContentStatus(id: string, newStatus: string) {
  const session = await requireSession();
  
  // Basic authorization check
  if (!["owner", "admin", "lead", "co_lead", "content_lead"].includes(session.user.role as string)) {
    throw new Error("Unauthorized");
  }

  await db
    .update(contentItems)
    .set({ status: newStatus as any, updatedAt: new Date() })
    .where(eq(contentItems.id, id));

  revalidatePath("/lead/content");
}

export async function createContentIdea(title: string, description: string, platform: string) {
  const session = await requireSession();
  
  if (!["owner", "admin", "lead", "co_lead", "content_lead"].includes(session.user.role as string)) {
    throw new Error("Unauthorized");
  }

  await db.insert(contentItems).values({
    title,
    description,
    platform,
    status: "idea",
    authorId: session.user.id,
  });

  revalidatePath("/lead/content");
}
