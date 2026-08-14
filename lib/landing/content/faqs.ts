import type { FaqItem } from "./contracts";

export const FESTIVAL_FAQS = [
  {
    id: "join-club",
    topic: "membership",
    question: "How do I join the Student Developer Club?",
    answer: "You can join by registering on our platform, joining our community channels, and attending our upcoming events.",
  },
  {
    id: "beginners",
    topic: "eligibility",
    question: "I don't know how to code. Can I still join?",
    answer: "Yes! SDC is open to everyone regardless of their technical background. We have beginner-friendly events to help you get started.",
  },
  {
    id: "events",
    topic: "events",
    question: "What kind of events do you host?",
    answer: "We host workshops on web/app development, AI, hackathons, open-source days, and tech talks from industry experts.",
  },
  {
    id: "core-team",
    topic: "leadership",
    question: "How can I join the Core Team?",
    answer: "We open applications for the Core Team annually. Active community members with strong skills and dedication are encouraged to apply.",
  },
  {
    id: "community-discord",
    topic: "community",
    question: "Where does the community hang out?",
    answer: "We have an active Discord server where members ask questions, share resources, and collaborate on projects.",
  },
  {
    id: "open-source-projects",
    topic: "projects",
    question: "Can I contribute to real-world projects?",
    answer: "Absolutely. We actively maintain open-source projects on our GitHub and guide members on how to make their first contributions.",
  },
] as const satisfies readonly FaqItem[];
