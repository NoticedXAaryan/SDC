import {
  ORGANIZER_NAMES,
  REQUIRED_HIGHLIGHTS,
  REQUIRED_STATISTICS,
  REQUIRED_FAQ_TOPICS,
  SPONSOR_TIER_NAMES,
  type FaqItem,
  type FestivalStat,
  type Highlight,
  type ImageAsset,
  type LandingContent,
  type Organizer,
  type Speaker,
  type SponsorTier,
} from "./contracts";

export interface ContentValidationIssue {
  path: string;
  code: string;
  message: string;
}

export interface ContentValidationResult {
  valid: boolean;
  issues: ContentValidationIssue[];
}

export function countWords(text: string): number {
  const normalized = text.trim();
  return normalized.length === 0 ? 0 : normalized.split(/\s+/u).length;
}

export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function isWordCountInRange(text: string, minimum: number, maximum: number): boolean {
  const count = countWords(text);
  return count >= minimum && count <= maximum;
}

export function isCharacterCountInRange(
  text: string,
  minimum: number,
  maximum: number,
): boolean {
  const count = countCharacters(text);
  return count >= minimum && count <= maximum;
}
function addIssue(
  issues: ContentValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function validateRequiredText(
  issues: ContentValidationIssue[],
  path: string,
  value: string,
): void {
  if (value.trim().length === 0) {
    addIssue(issues, path, "required", "Text must not be empty.");
  }
}

function validateUniqueIds(
  issues: ContentValidationIssue[],
  path: string,
  records: readonly { id: string }[],
): void {
  const seen = new Set<string>();
  records.forEach((record, index) => {
    validateRequiredText(issues, `${path}[${index}].id`, record.id);
    if (seen.has(record.id)) {
      addIssue(issues, `${path}[${index}].id`, "duplicate", `Duplicate id: ${record.id}`);
    }
    seen.add(record.id);
  });
}

export function validateImageAsset(
  image: ImageAsset,
  path = "image",
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  validateRequiredText(issues, `${path}.src`, image.src);
  validateRequiredText(issues, `${path}.alt`, image.alt);
  if (!Number.isInteger(image.width) || image.width <= 0) {
    addIssue(issues, `${path}.width`, "image-dimension", "Image width must be a positive integer.");
  }
  if (!Number.isInteger(image.height) || image.height <= 0) {
    addIssue(issues, `${path}.height`, "image-dimension", "Image height must be a positive integer.");
  }
  return issues;
}
export function validateOrganizers(organizers: readonly Organizer[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  if (organizers.length !== ORGANIZER_NAMES.length) {
    addIssue(issues, "organizers", "organizer-count", "Exactly three organizers are required.");
  }
  const names = new Set(organizers.map(({ name }) => name));
  for (const requiredName of ORGANIZER_NAMES) {
    if (!names.has(requiredName)) {
      addIssue(issues, "organizers", "organizer-missing", `Missing organizer: ${requiredName}`);
    }
  }
  organizers.forEach((organizer, index) => {
    const path = `organizers[${index}].description`;
    if (!isWordCountInRange(organizer.description, 20, 60)) {
      addIssue(issues, path, "word-count", "Organizer descriptions must contain 20 to 60 words.");
    }
  });
  return issues;
}

export function validateStatistics(statistics: readonly FestivalStat[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const pair = ({ label, value }: FestivalStat) => `${label}\u0000${value}`;
  const actual = new Set(statistics.map(pair));
  const expected = new Set(REQUIRED_STATISTICS.map(pair));
  if (statistics.length !== REQUIRED_STATISTICS.length || actual.size !== expected.size) {
    addIssue(issues, "statistics", "statistic-count", "Exactly four unique statistics are required.");
  }
  for (const statistic of REQUIRED_STATISTICS) {
    if (!actual.has(pair(statistic))) {
      addIssue(
        issues,
        "statistics",
        "statistic-mismatch",
        `Missing exact statistic pair: ${statistic.label} — ${statistic.value}`,
      );
    }
  }
  return issues;
}

export function validateHighlights(highlights: readonly Highlight[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  validateUniqueIds(issues, "highlights", highlights);
  const titles = new Set(highlights.map(({ title }) => title));
  for (const title of REQUIRED_HIGHLIGHTS) {
    if (!titles.has(title)) {
      addIssue(issues, "highlights", "highlight-missing", `Missing highlight: ${title}`);
    }
  }
  if (highlights.length < REQUIRED_HIGHLIGHTS.length) {
    addIssue(issues, "highlights", "highlight-count", "At least six highlights are required.");
  }
  const icons = new Set<Highlight["icon"]>();
  highlights.forEach((highlight, index) => {
    validateRequiredText(issues, `highlights[${index}].title`, highlight.title);
    validateRequiredText(issues, `highlights[${index}].accessibleLabel`, highlight.accessibleLabel);
    if (!isCharacterCountInRange(highlight.description, 1, 120)) {
      addIssue(
        issues,
        `highlights[${index}].description`,
        "character-count",
        "Highlight descriptions must contain 1 to 120 characters.",
      );
    }
    if (icons.has(highlight.icon)) {
      addIssue(issues, `highlights[${index}].icon`, "duplicate-icon", "Highlight icons must be unique.");
    }
    icons.add(highlight.icon);
  });
  return issues;
}

export function validateSpeakers(speakers: readonly Speaker[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  validateUniqueIds(issues, "speakers", speakers);
  if (speakers.length !== 0 && (speakers.length < 4 || speakers.length > 12)) {
    addIssue(issues, "speakers", "speaker-count", "Speakers must be empty or contain 4 to 12 records.");
  }
  speakers.forEach((speaker, index) => {
    validateRequiredText(issues, `speakers[${index}].fullName`, speaker.fullName);
    validateRequiredText(issues, `speakers[${index}].title`, speaker.title);
    validateRequiredText(issues, `speakers[${index}].organization`, speaker.organization);
    if (speaker.photo) {
      issues.push(...validateImageAsset(speaker.photo, `speakers[${index}].photo`));
    }
  });
  return issues;
}

export function validateSponsorTiers(tiers: readonly SponsorTier[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const names = new Set(tiers.map(({ name }) => name));
  if (tiers.length !== SPONSOR_TIER_NAMES.length) {
    addIssue(issues, "sponsorTiers", "sponsor-tier-count", "Exactly three sponsor tiers are required.");
  }
  for (const name of SPONSOR_TIER_NAMES) {
    if (!names.has(name)) {
      addIssue(issues, "sponsorTiers", "sponsor-tier-missing", `Missing sponsor tier: ${name}`);
    }
  }
  tiers.forEach((tier, tierIndex) => {
    validateUniqueIds(issues, `sponsorTiers[${tierIndex}].sponsors`, tier.sponsors);
    tier.sponsors.forEach((sponsor, sponsorIndex) => {
      validateRequiredText(
        issues,
        `sponsorTiers[${tierIndex}].sponsors[${sponsorIndex}].name`,
        sponsor.name,
      );
      issues.push(
        ...validateImageAsset(
          sponsor.logo,
          `sponsorTiers[${tierIndex}].sponsors[${sponsorIndex}].logo`,
        ),
      );
    });
  });
  return issues;
}

export function validateFaqs(faqs: readonly FaqItem[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  validateUniqueIds(issues, "faqs", faqs);
  if (faqs.length < REQUIRED_FAQ_TOPICS.length) {
    addIssue(issues, "faqs", "faq-count", "At least six FAQs are required.");
  }
  const topics = new Set(faqs.map(({ topic }) => topic));
  for (const topic of REQUIRED_FAQ_TOPICS) {
    if (!topics.has(topic)) {
      addIssue(issues, "faqs", "faq-topic-missing", `Missing FAQ topic: ${topic}`);
    }
  }
  faqs.forEach((faq, index) => {
    validateRequiredText(issues, `faqs[${index}].question`, faq.question);
    validateRequiredText(issues, `faqs[${index}].answer`, faq.answer);
  });
  return issues;
}

export function validateLandingContent(content: LandingContent): ContentValidationResult {
  const issues: ContentValidationIssue[] = [];
  if (!isWordCountInRange(content.aboutDescription, 30, 80)) {
    addIssue(
      issues,
      "aboutDescription",
      "word-count",
      "The About description must contain 30 to 80 words.",
    );
  }
  issues.push(...validateOrganizers(content.organizers));
  issues.push(...validateStatistics(content.statistics));
  issues.push(...validateHighlights(content.highlights));
  issues.push(...validateSpeakers(content.speakers));
  issues.push(...validateSponsorTiers(content.sponsorTiers));
  issues.push(...validateFaqs(content.faqs));
  return { valid: issues.length === 0, issues };
}

export function assertValidLandingContent(content: LandingContent): void {
  const result = validateLandingContent(content);
  if (!result.valid) {
    const details = result.issues.map(({ path, message }) => `${path}: ${message}`).join("\n");
    throw new Error(`Invalid landing content:\n${details}`);
  }
}
