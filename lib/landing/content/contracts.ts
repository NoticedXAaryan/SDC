import type { LucideIcon } from "lucide-react";

export const ORGANIZER_NAMES = ["Tech Workshops", "Hackathons", "Open Source"] as const;
export type OrganizerName = (typeof ORGANIZER_NAMES)[number];

export const REQUIRED_STATISTICS = [
  { label: "Starships Launched", value: "300+" },
  { label: "Galactic Credits", value: "₡200+ Billion" },
  { label: "Colony Investments", value: "₡40+ Billion" },
  { label: "Cosmic Roles Created", value: "1,600+" },
] as const;
export type FestivalStat = (typeof REQUIRED_STATISTICS)[number];

export const REQUIRED_HIGHLIGHTS = [
  "Web Development",
  "Hackathons",
  "Open Source",
  "Tech Talks",
  "AI & Machine Learning",
  "Vibrant Community",
] as const;
export type RequiredHighlightTitle = (typeof REQUIRED_HIGHLIGHTS)[number];

export interface ImageAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Organizer {
  name: OrganizerName;
  description: string;
  logoUrl?: string;
}

export interface Highlight {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  imageUrl?: string;
  accessibleLabel: string;
}
export interface Speaker {
  id: string;
  fullName: string;
  title: string;
  organization: string;
  photo: ImageAsset | null;
}

export const SPONSOR_TIER_NAMES = [
  "Platinum Partners",
  "Gold Partners",
  "Community Partners",
] as const;
export type SponsorTierName = (typeof SPONSOR_TIER_NAMES)[number];

export interface Sponsor {
  id: string;
  name: string;
  href?: string;
  logo: ImageAsset;
}

export interface SponsorTier {
  name: SponsorTierName;
  sponsors: readonly Sponsor[];
}

export const REQUIRED_FAQ_TOPICS = [
  "membership",
  "eligibility",
  "events",
  "leadership",
  "community",
  "projects",
] as const;
export type FaqTopic = (typeof REQUIRED_FAQ_TOPICS)[number];

export interface FaqItem {
  id: string;
  topic: FaqTopic;
  question: string;
  answer: string;
}

export interface LandingContent {
  aboutDescription: string;
  organizers: readonly Organizer[];
  statistics: readonly FestivalStat[];
  highlights: readonly Highlight[];
  speakers: readonly Speaker[];
  sponsorTiers: readonly SponsorTier[];
  faqs: readonly FaqItem[];
}
