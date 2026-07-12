import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { and, eq, count, asc } from "drizzle-orm";
import { IRegistrationRepository } from "@/lib/interfaces/IRegistrationRepository";
import crypto from "crypto";

export class DrizzleRegistrationRepository implements IRegistrationRepository {
  async findByEventAndUser(eventId: string, userId: string): Promise<any | null> {
    const reg = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.eventId, eventId),
        eq(registrations.userId, userId)
      )
    });
    return reg || null;
  }

  async countConfirmed(eventId: string): Promise<number> {
    const confirmedCountResult = await db.select({ count: count() })
      .from(registrations)
      .where(and(
        eq(registrations.eventId, eventId),
        eq(registrations.status, "confirmed")
      ));
    return confirmedCountResult[0].count;
  }

  async create(registration: any): Promise<any> {
    const [inserted] = await db.insert(registrations).values({
      id: crypto.randomUUID(),
      ...registration
    }).returning();
    return inserted;
  }

  async getFirstWaitlisted(eventId: string): Promise<any | null> {
    const reg = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.eventId, eventId),
        eq(registrations.status, "waitlist")
      ),
      orderBy: [asc(registrations.createdAt)]
    });
    return reg || null;
  }

  async updateStatus(registrationId: string, status: "confirmed" | "waitlist" | "cancelled" | "checked_in" | "no_show"): Promise<void> {
    await db.update(registrations).set({ status }).where(eq(registrations.id, registrationId));
  }
}
