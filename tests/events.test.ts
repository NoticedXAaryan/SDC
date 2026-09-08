import { describe, expect, it } from "vitest";
import { assertEventConfiguration, canTransitionEventStatus, PAID_EVENTS_UNAVAILABLE_MESSAGE } from "@/lib/domain/event";
import {
  createEventSchema,
  updateEventSchema,
  validateEventRegistrationResponses,
} from "@/lib/validators/event";

const validEvent = {
  title: "Production Workshop",
  type: "workshop" as const,
  description: "A complete production-ready workshop.",
  startsAt: "2030-01-10T10:00:00.000Z",
  endsAt: "2030-01-10T12:00:00.000Z",
  registrationDeadline: "2030-01-10T09:00:00.000Z",
  isPaid: false,
  price: 0,
};

describe("event lifecycle validation", () => {
  it("accepts a valid free event", () => {
    expect(createEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("rejects paid events without a positive price", () => {
    expect(createEventSchema.safeParse({ ...validEvent, isPaid: true, price: 0 }).success).toBe(false);
    expect(() => assertEventConfiguration({ ...validEvent, isPaid: true, price: 0 })).toThrow(/price/i);
  });

  it("documents the fail-closed paid-event publishing policy", () => {
    expect(PAID_EVENTS_UNAVAILABLE_MESSAGE).toMatch(/payment provider.*webhook/i);
  });

  it("rejects invalid time windows on create and update", () => {
    expect(createEventSchema.safeParse({ ...validEvent, endsAt: validEvent.startsAt }).success).toBe(false);
    expect(updateEventSchema.safeParse({ startsAt: validEvent.startsAt, endsAt: validEvent.startsAt }).success).toBe(false);
    expect(updateEventSchema.safeParse({
      startsAt: validEvent.startsAt,
      registrationDeadline: "2030-01-10T11:00:00.000Z",
    }).success).toBe(false);
  });

  it("only permits forward terminal-safe event transitions", () => {
    expect(canTransitionEventStatus("draft", "published")).toBe(true);
    expect(canTransitionEventStatus("published", "completed")).toBe(true);
    expect(canTransitionEventStatus("cancelled", "published")).toBe(false);
    expect(canTransitionEventStatus("completed", "draft")).toBe(false);
  });
});

describe("event registration form verification", () => {
  const fields = [
    { id: "name", type: "text" as const, question: "Name", required: true },
    { id: "track", type: "dropdown" as const, question: "Track", required: true, options: ["Web", "AI"] },
  ];

  it("accepts only declared, complete responses", () => {
    expect(validateEventRegistrationResponses(fields, { name: "Ada", track: "AI" })).toEqual({ name: "Ada", track: "AI" });
  });

  it("rejects missing, forged, and invalid dropdown responses", () => {
    expect(() => validateEventRegistrationResponses(fields, { name: "Ada" })).toThrow();
    expect(() => validateEventRegistrationResponses(fields, { name: "Ada", track: "AI", admin: "true" })).toThrow();
    expect(() => validateEventRegistrationResponses(fields, { name: "Ada", track: "Other" })).toThrow();
  });
});
