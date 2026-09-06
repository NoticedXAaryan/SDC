import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkEmergencyFreeze, canTransition } from "@/lib/dal/auth";

const { readSettings } = vi.hoisted(() => ({ readSettings: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: readSettings }) }) }) },
}));

describe("Club permissions", () => {
  beforeEach(() => { readSettings.mockReset().mockResolvedValue([{ isFrozen: true }]); });

  it.each(["owner", "admin", "faculty_coordinator"])("%s can act during an emergency freeze", async (role) => {
    await expect(checkEmergencyFreeze(role)).resolves.toBeUndefined();
    expect(readSettings).not.toHaveBeenCalled();
  });
  it.each(["member", "lead", "co_lead", "outsider"])("%s is blocked by an actual frozen setting", async (role) => {
    await expect(checkEmergencyFreeze(role)).rejects.toThrow("Club Operations Frozen");
  });
  it("allows members when operations resume", async () => {
    readSettings.mockResolvedValue([{ isFrozen: false }]);
    await expect(checkEmergencyFreeze("member")).resolves.toBeUndefined();
  });
  it("members can submit expenses but cannot approve them", () => {
    expect(canTransition("member", "expense", "draft", "pending")).toBe(true);
    expect(canTransition("member", "expense", "pending", "approved")).toBe(false);
  });
  it("co-leads can prepare work but cannot grant final approvals", () => {
    expect(canTransition("co_lead", "event", "draft", "pending")).toBe(true);
    expect(canTransition("co_lead", "event", "draft", "published")).toBe(false);
    expect(canTransition("co_lead", "application", "interviewing", "accepted")).toBe(false);
  });
});
