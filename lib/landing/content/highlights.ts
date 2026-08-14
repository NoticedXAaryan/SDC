import {
  Code,
  Terminal,
  Cpu,
  Globe,
  Rocket,
  Users,
} from "lucide-react";

import type { Highlight } from "./contracts";

export const FESTIVAL_HIGHLIGHTS = [
  {
    id: "web-dev",
    title: "Web Development",
    description: "Learn modern frameworks like React, Next.js, and Tailwind CSS to build stunning, responsive websites.",
    icon: Globe,
    imageUrl: "/images/highlights/keynote.png",
    accessibleLabel: "Globe representing web development",
  },
  {
    id: "hackathons",
    title: "Hackathons",
    description: "Collaborate, innovate, and build projects in time-constrained environments to win prizes and recognition.",
    icon: Rocket,
    imageUrl: "/images/highlights/competition.png",
    accessibleLabel: "Rocket representing hackathons",
  },
  {
    id: "open-source",
    title: "Open Source",
    description: "Contribute to real-world projects, learn Git, and collaborate with the global developer community.",
    icon: Code,
    imageUrl: "/images/highlights/panel.png",
    accessibleLabel: "Code representing open source",
  },
  {
    id: "tech-talks",
    title: "Tech Talks",
    description: "Attend sessions by industry experts and alumni to stay updated on the latest technology trends.",
    icon: Terminal,
    imageUrl: "/images/highlights/showcase.png",
    accessibleLabel: "Terminal representing tech talks",
  },
  {
    id: "ai-ml",
    title: "AI & Machine Learning",
    description: "Explore the world of artificial intelligence, train models, and build intelligent applications.",
    icon: Cpu,
    imageUrl: "/images/highlights/workshop.png",
    accessibleLabel: "CPU representing AI and ML",
  },
  {
    id: "community",
    title: "Vibrant Community",
    description: "Connect with like-minded peers, find co-founders for your ideas, and grow together.",
    icon: Users,
    imageUrl: "/images/highlights/networking.png",
    accessibleLabel: "Users representing community",
  },
] as const satisfies readonly Highlight[];
