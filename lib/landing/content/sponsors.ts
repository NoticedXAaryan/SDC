import type { SponsorTier } from "./contracts";

export const FESTIVAL_SPONSOR_TIERS = [
  {
    name: "Platinum Partners",
    sponsors: [],
  },
  {
    name: "Gold Partners",
    sponsors: [],
  },
  {
    name: "Community Partners",
    sponsors: [
      {
        id: "club-logo",
        name: "Student Developer Club",
        logo: {
          src: "/logo.png",
          width: 1109,
          height: 421,
          alt: "SDC Logo",
        },
      },
    ],
  },
] as const satisfies readonly SponsorTier[];
