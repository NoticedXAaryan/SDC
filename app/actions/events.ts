"use server";

import { requireSession } from "@/lib/dal/auth";
import { EventService } from "@/lib/services/events";
import { revalidatePath } from "next/cache";

export async function registerForEventAction(eventId: string) {
  try {
    const session = await requireSession();
    
    const registration = await EventService.registerForEvent(eventId, session.user.id);
    
    revalidatePath("/events/[slug]", "page");
    revalidatePath("/dashboard");
    
    return { success: true, registration };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register" };
  }
}
