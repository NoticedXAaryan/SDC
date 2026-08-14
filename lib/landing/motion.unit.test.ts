import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVEAL_ANIMATION, INITIAL_REVEAL_STATE, PAGE_ANIMATION_EASING,
  REVEAL_INTERSECTION_THRESHOLD, advanceRevealState,
  isApprovedAnimationDescriptor, projectAnimation,
  type AnimationDescriptor,
} from "./motion";

const descriptor = (overrides: Partial<AnimationDescriptor> = {}): AnimationDescriptor => ({
  ...DEFAULT_REVEAL_ANIMATION, ...overrides,
});

describe("page animation policy", () => {
  it("defines the approved reveal distance, timing, and ease-out curve", () => {
    expect(REVEAL_INTERSECTION_THRESHOLD).toBe(0.2);
    expect(DEFAULT_REVEAL_ANIMATION).toEqual({
      initial: { opacity: 0, y: 24 }, final: { opacity: 1, y: 0 },
      durationMs: 450, easing: PAGE_ANIMATION_EASING,
    });
    expect(isApprovedAnimationDescriptor(descriptor({ durationMs: 300 }))).toBe(true);
    expect(isApprovedAnimationDescriptor(descriptor({ durationMs: 600 }))).toBe(true);
  });

  it("rejects timing, easing, opacity, and upward-distance policy violations", () => {
    expect(isApprovedAnimationDescriptor(descriptor({ durationMs: 299 }))).toBe(false);
    expect(isApprovedAnimationDescriptor(descriptor({ durationMs: 601 }))).toBe(false);
    expect(isApprovedAnimationDescriptor(descriptor({ easing: "easeIn" as "easeOut" }))).toBe(false);
    expect(isApprovedAnimationDescriptor(descriptor({ initial: { opacity: -0.1, y: 24 } }))).toBe(false);
    expect(isApprovedAnimationDescriptor(descriptor({ initial: { opacity: 0, y: 25 } }))).toBe(false);
  });

  it("projects approved motion to Motion-compatible seconds", () => {
    expect(projectAnimation(DEFAULT_REVEAL_ANIMATION, false)).toEqual({
      initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45, ease: "easeOut" },
    });
  });

  it("projects reduced motion directly to the final state without a transition", () => {
    const projection = projectAnimation(DEFAULT_REVEAL_ANIMATION, true);
    expect(projection).toEqual({
      initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 },
    });
    expect(projection).not.toHaveProperty("transition");
    expect(() => projectAnimation(descriptor({ durationMs: 200 }), false)).toThrow(RangeError);
  });
});

describe("one-time reveal state", () => {
  it("reveals at 20% but not below it", () => {
    expect(advanceRevealState(INITIAL_REVEAL_STATE, 0.199)).toBe("hidden");
    expect(advanceRevealState(INITIAL_REVEAL_STATE, 0.2)).toBe("revealed");
  });

  it("remains revealed after later exits and ignores invalid ratios while hidden", () => {
    expect(advanceRevealState("revealed", 0)).toBe("revealed");
    expect(advanceRevealState("hidden", Number.NaN)).toBe("hidden");
  });
});
