import "server-only";

import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { prepareSchedule, type ScheduleEvent } from "./schedule";

// ─── Public result type ────────────────────────────────────────────────────────

export type ScheduleLoadResult =
  | { state: "ready"; events: ScheduleEvent[] }
  | { state: "unavailable"; events: []; message: string };

// ─── Constants ─────────────────────────────────────────────────────────────────

const UNAVAILABLE_MESSAGE = "Event data is temporarily unavailable.";

// ─── Loader ────────────────────────────────────────────────────────────────────

/**
 * Queries the published event schedule from the database and returns a
 * discriminated union that downstream Server Components can safely consume.
 *
 * - Selects only public fields (no internal or sensitive columns).
 * - Filters published records at the database boundary.
 * - Orders deterministically: day ASC, startTime ASC, id ASC.
 * - Normalizes through the pure schedule module (second-pass filter & sort).
 * - Catches and sanitizes all database/query failures.
 * - Never exposes database details to the client.
 */
export async function loadPublishedSchedule(): Promise<ScheduleLoadResult> {
  try {
    const rawRows = await db
      .select({
        id: events.id,
        title: events.title,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        location: events.location,
        type: events.type,
        status: events.status,
        capacity: events.capacity,
      })
      .from(events)
      .where(eq(events.status, "published"))
      .orderBy(asc(events.startsAt), asc(events.id));

    const rows = rawRows.map(row => ({
      id: row.id,
      name: row.title,
      day: row.startsAt.getDate() === 24 ? 1 : (row.startsAt.getDate() === 25 ? 2 : 1),
      startTime: row.startsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
      endTime: row.endsAt ? row.endsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : "23:59",
      venue: row.location || "TBA",
      type: row.type || "open",
      status: row.status,
      capacity: row.capacity,
      currentRegistrations: (row as any).currentRegistrations ?? 0,
      coordinatorName: (row as any).coordinatorName ?? "",
    }));

    // Normalize through the pure schedule module for second-pass validation,
    // deterministic sort, and registration-status derivation.
    const prepared = prepareSchedule(rows);

    return { state: "ready", events: prepared };
  } catch (error: unknown) {
    // Log a sanitized diagnostic — never include raw DB errors in the response.
    const sanitized =
      error instanceof Error ? error.message : "Unknown schedule query error";
    console.error(
      `[schedule-loader] Failed to load published schedule: ${sanitized}`,
    );

    return {
      state: "unavailable",
      events: [],
      message: UNAVAILABLE_MESSAGE,
    };
  }
}
