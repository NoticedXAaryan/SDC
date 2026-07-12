"use server";

import { requireSession } from "@/lib/dal/auth";
import { EventService } from "@/lib/services/events";
import { DrizzleEventRepository } from "@/lib/repositories/drizzle/DrizzleEventRepository";
import { DrizzleRegistrationRepository } from "@/lib/repositories/drizzle/DrizzleRegistrationRepository";
import { revalidatePath } from "next/cache";

export async function registerForEventAction(eventId: string) {
  try {
    const session = await requireSession();
    
    const eventService = new EventService(
      new DrizzleEventRepository(),
      new DrizzleRegistrationRepository()
    );
    const registration = await eventService.registerForEvent(eventId, session.user.id);
    
    revalidatePath("/events/[slug]", "page");
    revalidatePath("/dashboard");
    
    return { success: true, registration };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register" };
  }
}

