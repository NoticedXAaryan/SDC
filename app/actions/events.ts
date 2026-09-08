"use server";

import { checkEmergencyFreeze, requireSession } from "@/lib/dal/auth";
import { registerForEvent } from "@/lib/dal/events";
import { revalidatePath } from "next/cache";

export async function registerForEventAction(eventId: string) {
  try {
    const session = await requireSession();
    await checkEmergencyFreeze(session.user.role as string);
    const registration = await registerForEvent(session, eventId);
    if ("error" in registration) {
      return { success: false, error: registration.error };
    }
    
    revalidatePath("/events/[slug]", "page");
    revalidatePath("/dashboard");
    
    return { success: true, registration };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register" };
  }
}
