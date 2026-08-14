import { describe, expect, it } from "vitest";

import type { Speaker, SponsorTier } from "./contracts";
import { prepareSpeakers, prepareSponsorTiers } from "./preparation";

const sponsor = (id: string) => ({
  id,
  name: id,
  logo: { src: `/${id}.svg`, width: 160, height: 48, alt: id },
});

const speaker: Speaker = {
  id: "speaker-1",
  fullName: "Speaker One",
  title: "Founder",
  organization: "Example Ventures",
  photo: null,
};

describe("prepareSponsorTiers", () => {
  it("removes empty tiers without changing retained order or records", () => {
    const title = { name: "Platinum Partners", sponsors: [sponsor("title")] } as const;
    const associate = { name: "Gold Partners", sponsors: [] } as const;
    const partners = { name: "Community Partners", sponsors: [sponsor("partner")] } as const;
    const tiers: readonly SponsorTier[] = [title, associate, partners];

    const prepared = prepareSponsorTiers(tiers);

    expect(prepared).toEqual([title, partners]);
    expect(prepared[0]).toBe(title);
    expect(prepared[1]).toBe(partners);
    expect(tiers).toEqual([title, associate, partners]);
  });

  it("returns an empty collection when every tier is empty", () => {
    const tiers: readonly SponsorTier[] = [
      { name: "Platinum Partners", sponsors: [] },
      { name: "Community Partners", sponsors: [] },
    ];

    expect(prepareSponsorTiers(tiers)).toEqual([]);
  });
});

describe("prepareSpeakers", () => {
  it("omits empty speaker content", () => {
    expect(prepareSpeakers([])).toBeNull();
  });

  it("returns populated speaker content unchanged", () => {
    const speakers = [speaker] as const;

    expect(prepareSpeakers(speakers)).toBe(speakers);
  });
});