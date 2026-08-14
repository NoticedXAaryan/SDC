import type { ImageAsset, Speaker } from "./contracts";

export const SPEAKER_PLACEHOLDER_IMAGE = {
  src: "/images/speaker-placeholder.svg",
  width: 512,
  height: 512,
  alt: "Generic avatar",
} as const satisfies ImageAsset;

export const FESTIVAL_SPEAKERS = [
  {
    id: "lead-tba",
    fullName: "SDC Lead",
    title: "Community Lead",
    organization: "Student Developer Club",
    photo: { ...SPEAKER_PLACEHOLDER_IMAGE, alt: "Profile placeholder" },
  },
  {
    id: "tech-lead",
    fullName: "Tech Lead",
    title: "Technical Head",
    organization: "Student Developer Club",
    photo: { ...SPEAKER_PLACEHOLDER_IMAGE, alt: "Profile placeholder" },
  },
  {
    id: "design-lead",
    fullName: "Design Lead",
    title: "UI/UX Head",
    organization: "Student Developer Club",
    photo: { ...SPEAKER_PLACEHOLDER_IMAGE, alt: "Profile placeholder" },
  },
  {
    id: "event-lead",
    fullName: "Event Lead",
    title: "Event Manager",
    organization: "Student Developer Club",
    photo: { ...SPEAKER_PLACEHOLDER_IMAGE, alt: "Profile placeholder" },
  },
] as const satisfies readonly Speaker[];
