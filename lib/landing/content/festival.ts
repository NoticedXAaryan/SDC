import type { LandingContent } from "./contracts";
import { ABOUT_DESCRIPTION, FESTIVAL_ORGANIZERS, FESTIVAL_STATISTICS } from "./about";
import { FESTIVAL_FAQS } from "./faqs";
import { FESTIVAL_HIGHLIGHTS } from "./highlights";
import { FESTIVAL_SPEAKERS } from "./speakers";
import { FESTIVAL_SPONSOR_TIERS } from "./sponsors";
import { assertValidLandingContent } from "./validation";

export const FESTIVAL_CONTENT = {
  aboutDescription: ABOUT_DESCRIPTION,
  organizers: FESTIVAL_ORGANIZERS,
  statistics: FESTIVAL_STATISTICS,
  highlights: FESTIVAL_HIGHLIGHTS,
  speakers: FESTIVAL_SPEAKERS,
  sponsorTiers: FESTIVAL_SPONSOR_TIERS,
  faqs: FESTIVAL_FAQS,
} as const satisfies LandingContent;

assertValidLandingContent(FESTIVAL_CONTENT);
