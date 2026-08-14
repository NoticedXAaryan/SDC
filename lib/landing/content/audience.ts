import { GraduationCap, Code2, MonitorPlay, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AudienceGroup {
  id: string;
  title: string;
  description: string;
  outcomes: readonly string[];
  icon: LucideIcon;
  accessibleLabel: string;
}

export const FESTIVAL_AUDIENCES = [
  {
    id: "students",
    title: "Students & Beginners",
    description:
      "Start your coding journey with beginner-friendly workshops, mentorship, and a supportive community.",
    outcomes: [
      "Learn coding fundamentals",
      "Build your first project",
      "Get guided mentorship",
    ],
    icon: GraduationCap,
    accessibleLabel: "Graduation cap representing students",
  },
  {
    id: "developers",
    title: "Experienced Developers",
    description:
      "Take your skills to the next level, participate in hackathons, and contribute to open-source projects.",
    outcomes: [
      "Advanced tech workshops",
      "Hackathon participation",
      "Open-source contributions",
    ],
    icon: Code2,
    accessibleLabel: "Code brackets representing developers",
  },
  {
    id: "designers",
    title: "UI/UX Designers",
    description:
      "Design intuitive interfaces, collaborate with developers, and build a stunning portfolio.",
    outcomes: [
      "Design systems & prototyping",
      "Developer collaboration",
      "Portfolio building",
    ],
    icon: MonitorPlay,
    accessibleLabel: "Monitor representing designers",
  },
  {
    id: "leaders",
    title: "Community Leaders",
    description:
      "Step up, organize events, guide peers, and build your leadership and management skills.",
    outcomes: [
      "Event organization",
      "Public speaking",
      "Networking & growth",
    ],
    icon: Users2,
    accessibleLabel: "Group representing community leaders",
  },
] as const satisfies readonly AudienceGroup[];
