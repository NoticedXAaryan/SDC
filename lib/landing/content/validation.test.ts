import assert from "node:assert/strict";
import { test, expect } from "vitest";
import type { LucideIcon } from "lucide-react";

import type { LandingContent, RequiredHighlightTitle } from "./contracts";
import {
  countCharacters,
  countWords,
  validateLandingContent,
} from "./validation";

const IconA = (() => null) as unknown as LucideIcon;
const IconB = (() => null) as unknown as LucideIcon;
const IconC = (() => null) as unknown as LucideIcon;
const IconD = (() => null) as unknown as LucideIcon;
const IconE = (() => null) as unknown as LucideIcon;
const IconF = (() => null) as unknown as LucideIcon;

const words = (count: number) => Array.from({ length: count }, (_, i) => `word${i}`).join(" ");

function validContent(): LandingContent {
  const highlightTitles: readonly RequiredHighlightTitle[] = [
    "Web Development",
    "Hackathons",
    "Open Source",
    "Tech Talks",
    "AI & Machine Learning",
    "Vibrant Community",
  ];
  const icons = [IconA, IconB, IconC, IconD, IconE, IconF];

  return {
    aboutDescription: words(30),
    organizers: [
      { name: "Tech Workshops", description: words(20) },
      { name: "Hackathons", description: words(20) },
      { name: "Open Source", description: words(20) },
    ],
    statistics: [
      { label: "Learning Tracks", value: "6" },
      { label: "Community Access", value: "Open" },
      { label: "Build Sessions", value: "Weekly" },
      { label: "Led By", value: "Students" },
    ],
    highlights: highlightTitles.map((title, index) => ({
      id: `highlight-${index}`,
      title,
      description: "A concise description.",
      icon: icons[index],
      accessibleLabel: `${title} icon`,
    })),
    speakers: Array.from({ length: 4 }, (_, index) => ({
      id: `speaker-${index}`,
      fullName: `Speaker ${index}`,
      title: "Founder",
      organization: "Example Ventures",
      photo: { src: `/speaker-${index}.jpg`, width: 400, height: 400, alt: `Speaker ${index}` },
    })),
    sponsorTiers: [
      { name: "Platinum Partners", sponsors: [] },
      { name: "Gold Partners", sponsors: [] },
      {
        name: "Community Partners",
        sponsors: [
          {
            id: "partner-1",
            name: "Partner One",
            logo: { src: "/partner.svg", width: 160, height: 48, alt: "Partner One" },
          },
        ],
      },
    ],
    faqs: [
      "membership",
      "eligibility",
      "events",
      "leadership",
      "community",
      "projects",
    ].map((topic, index) => ({
      id: `faq-${index}`,
      topic: topic as LandingContent["faqs"][number]["topic"],
      question: `Question ${index}?`,
      answer: `Answer ${index}.`,
    })),
  };
}
test("accepts content at required count and text boundaries", () => {
  const result = validateLandingContent(validContent());
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("reports exact-pair, range, coverage, icon, and image violations", () => {
  const content = validContent();
  content.aboutDescription = words(29);
  content.statistics = [
    { label: "Community Access", value: "Open" },
    { label: "Community Access", value: "Open" },
    { label: "Build Sessions", value: "Weekly" },
    { label: "Led By", value: "Students" },
  ];
  content.highlights[1].icon = content.highlights[0].icon;
  content.speakers[0].photo = { src: "/bad.jpg", width: 0, height: 400, alt: "" };
  content.faqs = content.faqs.slice(0, 5);

  const result = validateLandingContent(content);
  const codes = new Set(result.issues.map(({ code }) => code));

  assert.equal(result.valid, false);
  assert.ok(codes.has("word-count"));
  assert.ok(codes.has("statistic-mismatch"));
  assert.ok(codes.has("duplicate-icon"));
  assert.ok(codes.has("image-dimension"));
  assert.ok(codes.has("faq-count"));
  assert.ok(codes.has("faq-topic-missing"));
});

test("counts Unicode code points and whitespace-separated words", () => {
  assert.equal(countWords("  one\n two\tthree  "), 3);
  assert.equal(countWords("   "), 0);
  assert.equal(countCharacters("A😀B"), 3);
});

test("allows an empty optional speaker collection", () => {
  const content = validContent();
  content.speakers = [];
  assert.equal(validateLandingContent(content).valid, true);
});
