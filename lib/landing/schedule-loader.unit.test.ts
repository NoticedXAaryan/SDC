import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock server-only (it throws at import time in non-server contexts)
vi.mock("server-only", () => ({}));

// Mock the database module
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return {
                orderBy: (...oArgs: unknown[]) => {
                  mockOrderBy(...oArgs);
                  return mockOrderBy.mock.results[
                    mockOrderBy.mock.results.length - 1
                  ]?.value;
                },
              };
            },
          };
        },
      };
    },
  },
}));

vi.mock("@/lib/schema", () => ({
  events: {
    id: "events.id",
    name: "events.name",
    day: "events.day",
    startTime: "events.startTime",
    endTime: "events.endTime",
    venue: "events.venue",
    type: "events.type",
    status: "events.status",
    capacity: "events.capacity",
    currentRegistrations: "events.currentRegistrations",
    coordinatorName: "events.coordinatorName",
  },
}));

import { loadPublishedSchedule } from "./schedule-loader";

describe("loadPublishedSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ready state with normalized events on successful query", async () => {
    const dbRows = [
      {
        id: "evt-1",
        title: "Opening Keynote",
        startsAt: new Date("2024-10-24T09:00:00+05:30"),
        endsAt: new Date("2024-10-24T10:00:00+05:30"),
        location: "Main Hall",
        type: "open",
        status: "published",
        capacity: null,
        currentRegistrations: 0,
        coordinatorName: "Alice",
      },
      {
        id: "evt-2",
        title: "Workshop A",
        startsAt: new Date("2024-10-24T10:30:00+05:30"),
        endsAt: new Date("2024-10-24T12:00:00+05:30"),
        location: "Room B",
        type: "registration",
        status: "published",
        capacity: 50,
        currentRegistrations: 30,
        coordinatorName: "Bob",
      },
    ];

    mockOrderBy.mockResolvedValueOnce(dbRows);

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("ready");
    expect(result.events).toHaveLength(2);
    expect(result.events[0].id).toBe("evt-1");
    expect(result.events[0].status).toBe("published");
    expect(result.events[0].registrationStatus).toBeNull(); // open type
    expect(result.events[1].registrationStatus).toBe("open"); // registration type, below capacity
  });

  it("returns ready state with empty events when no published events exist", async () => {
    mockOrderBy.mockResolvedValueOnce([]);

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("ready");
    expect(result.events).toEqual([]);
  });

  it("returns unavailable state when query throws an error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockOrderBy.mockRejectedValueOnce(
      new Error("connection refused to 10.0.0.5:5432"),
    );

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("unavailable");
    expect(result.events).toEqual([]);
    expect((result as { message?: string }).message).toBe("Event data is temporarily unavailable.");
    // Verify error was logged but sanitized (no raw DB connection details in response)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[schedule-loader]"),
    );
    consoleSpy.mockRestore();
  });

  it("returns unavailable state when a non-Error is thrown", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockOrderBy.mockRejectedValueOnce("string error");

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("unavailable");
    expect(result.events).toEqual([]);
    expect((result as { message?: string }).message).toBe("Event data is temporarily unavailable.");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown schedule query error"),
    );
    consoleSpy.mockRestore();
  });

  it("quarantines malformed rows and returns only valid published events", async () => {
    const dbRows = [
      {
        id: "evt-good",
        title: "Valid Event",
        startsAt: new Date("2024-10-24T09:00:00+05:30"),
        endsAt: new Date("2024-10-24T10:00:00+05:30"),
        location: "Main Hall",
        type: "open",
        status: "published",
        capacity: null,
        currentRegistrations: 0,
        coordinatorName: "Alice",
      },
      {
        id: "evt-bad",
        title: "Bad Event",
        startsAt: { getDate: () => 3, toLocaleTimeString: () => "25:00" }, // Invalid fake date to trigger quarantine
        endsAt: new Date("2024-10-26T10:00:00+05:30"),
        location: "Room A",
        type: "open",
        status: "published",
        capacity: null,
        currentRegistrations: 0,
        coordinatorName: "Bob",
      },
    ];

    mockOrderBy.mockResolvedValueOnce(dbRows);

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("ready");
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe("evt-good");
  });

  it("normalizes nullable coordinatorName to empty string", async () => {
    const dbRows = [
      {
        id: "evt-1",
        title: "Session",
        startsAt: new Date("2024-10-25T14:00:00+05:30"),
        endsAt: new Date("2024-10-25T15:00:00+05:30"),
        location: "Auditorium",
        type: "restricted",
        status: "published",
        capacity: 100,
        currentRegistrations: 0,
        coordinatorName: null,
      },
    ];

    mockOrderBy.mockResolvedValueOnce(dbRows);

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("ready");
    expect(result.events).toHaveLength(1);
    expect(result.events[0].coordinatorName).toBe("");
  });

  it("derives registration status correctly for full-capacity events", async () => {
    const dbRows = [
      {
        id: "evt-full",
        title: "Full Workshop",
        startsAt: new Date("2024-10-24T10:00:00+05:30"),
        endsAt: new Date("2024-10-24T12:00:00+05:30"),
        location: "Lab",
        type: "registration",
        status: "published",
        capacity: 20,
        currentRegistrations: 20,
        coordinatorName: "Charlie",
      },
    ];

    mockOrderBy.mockResolvedValueOnce(dbRows);

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("ready");
    expect(result.events[0].registrationStatus).toBe("full");
  });

  it("sorts events deterministically by day, startTime, and id", async () => {
    const dbRows = [
      {
        id: "evt-b",
        title: "Event B",
        startsAt: new Date("2024-10-24T09:00:00+05:30"),
        endsAt: new Date("2024-10-24T10:00:00+05:30"),
        location: "Hall",
        type: "open",
        status: "published",
        capacity: null,
        currentRegistrations: 0,
        coordinatorName: "",
      },
      {
        id: "evt-a",
        title: "Event A",
        startsAt: new Date("2024-10-24T09:00:00+05:30"),
        endsAt: new Date("2024-10-24T10:00:00+05:30"),
        location: "Hall",
        type: "open",
        status: "published",
        capacity: null,
        currentRegistrations: 0,
        coordinatorName: "",
      },
      {
        id: "evt-c",
        title: "Day 2 Event",
        startsAt: new Date("2024-10-25T08:00:00+05:30"),
        endsAt: new Date("2024-10-25T09:00:00+05:30"),
        location: "Hall",
        type: "open",
        status: "published",
        capacity: null,
        currentRegistrations: 0,
        coordinatorName: "",
      },
    ];

    mockOrderBy.mockResolvedValueOnce(dbRows);

    const result = await loadPublishedSchedule();

    expect(result.state).toBe("ready");
    expect(result.events.map((e) => e.id)).toEqual([
      "evt-a",
      "evt-b",
      "evt-c",
    ]);
  });
});
