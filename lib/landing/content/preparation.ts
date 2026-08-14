import type { Speaker, SponsorTier } from "./contracts";

/**
 * Removes sponsor tiers that have no records while retaining the exact input
 * order and tier objects for every populated tier.
 */
export function prepareSponsorTiers(
  tiers: readonly SponsorTier[],
): readonly SponsorTier[] {
  return tiers.filter((tier) => tier.sponsors.length > 0);
}

/**
 * Converts an empty speaker collection to React's explicit omission value.
 * Populated collections are returned unchanged.
 */
export function prepareSpeakers(
  speakers: readonly Speaker[],
): readonly Speaker[] | null {
  return speakers.length === 0 ? null : speakers;
}
