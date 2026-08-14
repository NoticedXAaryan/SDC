export type EventDay = 1 | 2;
export type EventType = "open" | "registration" | "restricted" | "shortlisted";
export type EventLifecycleStatus = "draft" | "published" | "archived";
export type RegistrationStatus = "open" | "full" | "closed";

export interface ScheduleEvent {
  id: string;
  name: string;
  day: EventDay;
  startTime: string;
  endTime: string;
  venue: string;
  type: EventType;
  status: "published";
  capacity: number | null;
  currentRegistrations: number;
  coordinatorName: string;
  registrationStatus: RegistrationStatus | null;
}

export interface EventCardViewModel {
  id: string;
  name: string;
  timeRange: string;
  venue: string;
  typeLabel: "Open" | "Registration" | "Restricted" | "Apply to Pitch";
  coordinatorName: string;
  registrationStatus: RegistrationStatus | null;
}

export interface QuarantinedScheduleRow {
  index: number;
  row: unknown;
  reasons: readonly string[];
}

export interface SchedulePreparationResult {
  events: ScheduleEvent[];
  quarantined: QuarantinedScheduleRow[];
}

interface NormalizedScheduleRow extends Omit<ScheduleEvent, "status" | "registrationStatus"> {
  status: EventLifecycleStatus;
}

const EVENT_TYPES = new Set<EventType>([
  "open",
  "registration",
  "restricted",
  "shortlisted",
]);
const EVENT_STATUSES = new Set<EventLifecycleStatus>([
  "draft",
  "published",
  "archived",
]);
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  row: Record<string, unknown>,
  field: string,
  reasons: string[],
): string {
  const value = row[field];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  reasons.push(`${field} must be a non-empty string`);
  return "";
}

function optionalString(
  row: Record<string, unknown>,
  field: string,
  reasons: string[],
): string {
  const value = row[field];
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  reasons.push(`${field} must be a string or null`);
  return "";
}

function nonNegativeInteger(
  value: unknown,
  field: string,
  reasons: string[],
  nullable: boolean,
): number | null {
  if (value == null) return nullable ? null : 0;
  if (Number.isInteger(value) && (value as number) >= 0) return value as number;
  reasons.push(`${field} must be a non-negative integer${nullable ? " or null" : ""}`);
  return nullable ? null : 0;
}

export type EventNormalizationResult =
  | { ok: true; event: NormalizedScheduleRow }
  | { ok: false; reasons: readonly string[] };

export function normalizePublicEventRecord(input: unknown): EventNormalizationResult {
  if (!isRecord(input)) {
    return { ok: false, reasons: ["event row must be an object"] };
  }

  const reasons: string[] = [];
  const id = requiredString(input, "id", reasons);
  const name = requiredString(input, "name", reasons);
  const venue = requiredString(input, "venue", reasons);
  const coordinatorName = optionalString(input, "coordinatorName", reasons);

  const day = input.day;
  if (day !== 1 && day !== 2) reasons.push("day must be 1 or 2");

  const startTime = input.startTime;
  if (typeof startTime !== "string" || !TIME_PATTERN.test(startTime)) {
    reasons.push("startTime must use valid HH:MM time");
  }
  const endTime = input.endTime;
  if (typeof endTime !== "string" || !TIME_PATTERN.test(endTime)) {
    reasons.push("endTime must use valid HH:MM time");
  }

  const type = input.type;
  if (typeof type !== "string" || !EVENT_TYPES.has(type as EventType)) {
    reasons.push("type must be a supported public event type");
  }
  const status = input.status;
  if (typeof status !== "string" || !EVENT_STATUSES.has(status as EventLifecycleStatus)) {
    reasons.push("status must be draft, published, or archived");
  }

  const capacity = nonNegativeInteger(input.capacity, "capacity", reasons, true);
  const currentRegistrations = nonNegativeInteger(
    input.currentRegistrations,
    "currentRegistrations",
    reasons,
    false,
  );
  if (reasons.length > 0) return { ok: false, reasons };

  return {
    ok: true,
    event: {
      id,
      name,
      day: day as EventDay,
      startTime: startTime as string,
      endTime: endTime as string,
      venue,
      type: type as EventType,
      status: status as EventLifecycleStatus,
      capacity,
      currentRegistrations: currentRegistrations as number,
      coordinatorName,
    },
  };
}

export interface RegistrationStatusInput {
  type: EventType;
  status: EventLifecycleStatus;
  capacity: number | null;
  currentRegistrations: number;
}

export function deriveRegistrationStatus({
  type,
  status,
  capacity,
  currentRegistrations,
}: RegistrationStatusInput): RegistrationStatus | null {
  if (type !== "registration" && type !== "shortlisted") return null;
  if (status === "archived") return "closed";
  if (capacity === null || currentRegistrations < capacity) return "open";
  return "full";
}

function compareScheduleEvents(a: ScheduleEvent, b: ScheduleEvent): number {
  if (a.day !== b.day) return a.day - b.day;
  if (a.startTime < b.startTime) return -1;
  if (a.startTime > b.startTime) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function prepareScheduleWithQuarantine(
  rows: readonly unknown[],
): SchedulePreparationResult {
  const events: ScheduleEvent[] = [];
  const quarantined: QuarantinedScheduleRow[] = [];

  rows.forEach((row, index) => {
    const normalized = normalizePublicEventRecord(row);
    if (!normalized.ok) {
      quarantined.push({ index, row, reasons: normalized.reasons });
      return;
    }
    if (normalized.event.status !== "published") return;

    const event = normalized.event;
    events.push({
      ...event,
      status: "published",
      registrationStatus: deriveRegistrationStatus(event),
    });
  });

  events.sort(compareScheduleEvents);
  return { events, quarantined };
}

export function prepareSchedule(rows: readonly unknown[]): ScheduleEvent[] {
  return prepareScheduleWithQuarantine(rows).events;
}

export function selectScheduleDay(
  events: readonly ScheduleEvent[],
  day: EventDay,
): ScheduleEvent[] {
  return events.filter((event) => event.day === day);
}

const EVENT_TYPE_LABELS: Record<EventType, EventCardViewModel["typeLabel"]> = {
  open: "Open",
  registration: "Registration",
  restricted: "Restricted",
  shortlisted: "Apply to Pitch",
};

export function formatEventType(type: EventType): EventCardViewModel["typeLabel"] {
  return EVENT_TYPE_LABELS[type];
}

export function formatEventTimeRange(startTime: string, endTime: string): string {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    throw new RangeError("Event times must use valid HH:MM values");
  }
  return `${startTime} – ${endTime}`;
}

export function projectEventCard(event: ScheduleEvent): EventCardViewModel {
  return {
    id: event.id,
    name: event.name,
    timeRange: formatEventTimeRange(event.startTime, event.endTime),
    venue: event.venue,
    typeLabel: formatEventType(event.type),
    coordinatorName: event.coordinatorName,
    registrationStatus: event.registrationStatus,
  };
}
