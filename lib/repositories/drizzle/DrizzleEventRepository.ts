import { db } from "../../../db";
import { events } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { IEventRepository } from "../../interfaces/IEventRepository";

export class DrizzleEventRepository implements IEventRepository {
  async findById(eventId: string): Promise<any> {
    return await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
  }

  async updateCapacity(eventId: string, newCount: number): Promise<void> {
    await db.update(events).set({ capacity: newCount }).where(eq(events.id, eventId));
  }
}
