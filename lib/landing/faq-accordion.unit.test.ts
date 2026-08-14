import { describe, expect, it } from "vitest";

import {
  INITIAL_FAQ_ACCORDION_STATE,
  createFaqAccordionReducer,
} from "./faq-accordion";

const reducer = createFaqAccordionReducer([
  "registration",
  "venue",
  "prizes",
]);
const activate = (id: string) => ({ type: "activate" as const, id });

describe("FAQ accordion reducer", () => {
  it("starts with every answer collapsed", () => {
    expect(INITIAL_FAQ_ACCORDION_STATE).toBeNull();
  });

  it("opens an activated valid FAQ and switches directly to another", () => {
    const first = reducer(INITIAL_FAQ_ACCORDION_STATE, activate("registration"));
    const second = reducer(first, activate("venue"));

    expect(first).toBe("registration");
    expect(second).toBe("venue");
  });

  it("collapses when the currently open FAQ is activated again", () => {
    expect(reducer("prizes", activate("prizes"))).toBeNull();
  });

  it("rejects an invalid activation without changing valid state", () => {
    expect(reducer("venue", activate("missing"))).toBe("venue");
    expect(reducer(null, activate("missing"))).toBeNull();
  });

  it("normalizes an invalid incoming state before reducing", () => {
    expect(reducer("stale-id", activate("missing"))).toBeNull();
    expect(reducer("stale-id", activate("registration"))).toBe("registration");
  });
});
