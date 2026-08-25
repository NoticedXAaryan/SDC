import { describe, expect, it } from "vitest";

import { viewerFromSession } from "./auth-routing";

describe("landing viewer routing", () => {
  it("sends every authenticated role to the real role-aware dashboard", () => {
    expect(viewerFromSession({ user: { role: "owner", name: "Ada" } })).toEqual({
      authenticated: true,
      role: "owner",
      dashboardPath: "/dashboard",
      image: undefined,
      name: "Ada",
    });
  });

  it("keeps guests on the public authentication path", () => {
    expect(viewerFromSession(null)).toEqual({
      authenticated: false,
      role: null,
      dashboardPath: null,
    });
  });
});
