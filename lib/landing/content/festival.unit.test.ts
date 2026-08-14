import { describe, expect, it } from "vitest";

import { SPONSOR_TIER_NAMES } from "./contracts";
import { FESTIVAL_CONTENT } from "./festival";
import { SPEAKER_PLACEHOLDER_IMAGE } from "./speakers";
import { validateLandingContent } from "./validation";

describe("festival content", () => {
  it("satisfies the landing content contract", () => {
    expect(validateLandingContent(FESTIVAL_CONTENT)).toEqual({ valid: true, issues: [] });
  });

  it("provides the required collections and exact sponsor tier order", () => {
    expect(FESTIVAL_CONTENT.organizers).toHaveLength(3);
    expect(FESTIVAL_CONTENT.statistics).toHaveLength(4);
    expect(FESTIVAL_CONTENT.highlights).toHaveLength(6);
    expect(FESTIVAL_CONTENT.speakers.length).toBeGreaterThanOrEqual(4);
    expect(FESTIVAL_CONTENT.speakers.length).toBeLessThanOrEqual(12);
    expect(FESTIVAL_CONTENT.sponsorTiers.map(({ name }) => name)).toEqual(SPONSOR_TIER_NAMES);
    expect(FESTIVAL_CONTENT.faqs.length).toBeGreaterThanOrEqual(6);
  });

  it("uses square, explicit placeholder metadata for unannounced speaker photos", () => {
    expect(SPEAKER_PLACEHOLDER_IMAGE.width).toBe(SPEAKER_PLACEHOLDER_IMAGE.height);
    for (const speaker of FESTIVAL_CONTENT.speakers) {
      expect(speaker.photo).toMatchObject({ src: SPEAKER_PLACEHOLDER_IMAGE.src, width: 512, height: 512 });
      expect(speaker.photo.alt.trim()).not.toBe("");
    }
  });
});
