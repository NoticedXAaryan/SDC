"use server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession, AuthorizationError } from "@/lib/dal/auth";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
export async function completeOnboarding(form: FormData) {
  const session = await requireSession();
  if (!session.user.emailVerified) throw new AuthorizationError("Verify your email first.");
  await db.update(user).set({ onboardingCompleted: true, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  revalidatePath("/", "layout");
  redirect(form.get("destination") === "apply" ? "/recruitment/apply" : sanitizeAuthRedirect(form.get("callbackUrl") as string));
}
