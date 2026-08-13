import { db } from "@/lib/db";
import { procurementRequests, vendors, user, expenses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

export async function getProcurementRequests(sessionAuth: AuthSession) {
  const role = sessionAuth.user.role as string;
  if (!["event_lead", "lead", "vice_lead", "finance_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  return await db.select({
    id: procurementRequests.id,
    title: procurementRequests.title,
    description: procurementRequests.description,
    status: procurementRequests.status,
    estimatedCost: procurementRequests.estimatedCost,
    quotesUrl: procurementRequests.quotesUrl,
    requesterName: user.name,
    vendorName: vendors.name,
  })
  .from(procurementRequests)
  .innerJoin(user, eq(user.id, procurementRequests.requestedBy))
  .leftJoin(vendors, eq(vendors.id, procurementRequests.selectedVendorId))
  .orderBy(desc(procurementRequests.createdAt));
}

export async function createProcurementRequest(sessionAuth: AuthSession, data: any) {
  const role = sessionAuth.user.role as string;
  if (!["event_lead", "lead", "vice_lead", "finance_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const { title, description, eventId, estimatedCost } = data;

  const [newRequest] = await db.insert(procurementRequests).values({
    id: nanoid(),
    title,
    description,
    eventId: eventId || null,
    estimatedCost: estimatedCost || null,
    requestedBy: sessionAuth.user.id,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return newRequest;
}

export async function updateProcurementStatus(sessionAuth: AuthSession, id: string, data: any) {
  const role = sessionAuth.user.role as string;
  if (!["finance_lead", "lead", "vice_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const [existing] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, id)).limit(1);
  if (!existing) throw new ValidationError("Not found");

  if (data.status === "approved" && existing.requestedBy === sessionAuth.user.id) {
    throw new AuthorizationError("You cannot approve your own procurement request.");
  }

  if (data.status === "rejected" && !data.reason) {
    throw new ValidationError("A reason is required when rejecting a procurement request.");
  }

  let success = false;
  
  await db.transaction(async (tx) => {
    await tx.update(procurementRequests).set({
      status: data.status,
      selectedVendorId: data.selectedVendorId || existing.selectedVendorId,
      quotesUrl: data.quotesUrl || existing.quotesUrl,
      updatedAt: new Date(),
    }).where(eq(procurementRequests.id, id));

    // For now, we skip auto-expense generation unless event budget logic allows it.
    // Sync to expenses can be enabled once specific requirements are given.
  });

  return { success: true, message: `Procurement updated to ${data.status}` };
}
