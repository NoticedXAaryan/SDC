import { db } from "@/lib/db";
import { auditLogs, procurementRequests, vendors, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { canTransitionProcurement } from "@/lib/workflows/procurement";

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

  const requestId = nanoid();
  const newRequest = await db.transaction(async (tx) => {
    const [created] = await tx.insert(procurementRequests).values({
      id: requestId,
      title,
      description,
      eventId: eventId || null,
      estimatedCost: estimatedCost ?? null,
      requestedBy: sessionAuth.user.id,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await tx.insert(auditLogs).values({
      id: nanoid(),
      actorId: sessionAuth.user.id,
      action: "procurement_created",
      entity: "procurement",
      entityId: requestId,
      details: JSON.stringify({ title, estimatedCost: estimatedCost ?? null }),
      timestamp: new Date(),
    });

    return created;
  });

  return newRequest;
}

export async function updateProcurementStatus(sessionAuth: AuthSession, id: string, data: any) {
  const role = sessionAuth.user.role as string;
  if (!["finance_lead", "lead", "vice_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const [existing] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, id)).limit(1);
  if (!existing) throw new ValidationError("Not found");

  const currentStatus = existing.status ?? "draft";
  if (!canTransitionProcurement(currentStatus, data.status)) {
    throw new ValidationError(`Cannot transition procurement from '${existing.status}' to '${data.status}'.`);
  }

  if (data.status === "approved" && existing.requestedBy === sessionAuth.user.id) {
    throw new AuthorizationError("You cannot approve your own procurement request.");
  }

  if (data.status === "rejected" && !data.reason) {
    throw new ValidationError("A reason is required when rejecting a procurement request.");
  }

  await db.transaction(async (tx) => {
    await tx.update(procurementRequests).set({
      status: data.status,
      selectedVendorId: data.selectedVendorId || existing.selectedVendorId,
      quotesUrl: data.quotesUrl || existing.quotesUrl,
      updatedAt: new Date(),
    }).where(eq(procurementRequests.id, id));

    await tx.insert(auditLogs).values({
      id: nanoid(),
      actorId: sessionAuth.user.id,
      action: `procurement_${data.status}`,
      entity: "procurement",
      entityId: id,
      details: JSON.stringify({
        previousStatus: currentStatus,
        newStatus: data.status,
        reason: data.reason ?? null,
        selectedVendorId: data.selectedVendorId ?? existing.selectedVendorId,
      }),
      timestamp: new Date(),
    });
  });

  return { success: true, message: `Procurement updated to ${data.status}` };
}
