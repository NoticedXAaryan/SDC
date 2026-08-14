export type GovernedStyleCategory = "color" | "spacing" | "radius" | "shadow";

export interface GovernedSource {
  path: string;
  content: string;
}

export interface GovernedStyleViolation {
  file: string;
  line: number;
  column: number;
  category: GovernedStyleCategory;
  value: string;
  message: string;
}

export interface GovernedTokenSet {
  colors: readonly string[];
  spacing: readonly string[];
  radii: readonly string[];
  shadows: readonly string[];
}

export const GOVERNED_TOKENS: GovernedTokenSet = {
  colors: [
    "canvas",
    "surface",
    "surface-alt",
    "ink",
    "ink-muted",
    "primary",
    "primary-strong",
    "secondary",
    "accent",
    "accent-strong",
    "focus",
    "hero",
  ],
  spacing: ["1", "2", "3", "4", "6", "8", "12", "16", "20", "24"],
  radii: ["sm", "md", "pill"],
  shadows: ["sm", "md", "lg"],
};

interface Candidate {
  category: GovernedStyleCategory;
  value: string;
  index: number;
  token?: string;
}
const COLOR_UTILITY = /^(?:bg|text|border|outline|decoration|fill|stroke|from|via|to)-(.+)$/u;
const SPACING_UTILITY = /^(?:[pm][trblxy]?|gap(?:-[xy])?|space-[xy]|scroll-m[trbl]?)-(.+)$/u;
const RADIUS_UTILITY = /^rounded(?:-[trbl]{1,2})?-(.+)$/u;
const SHADOW_UTILITY = /^shadow-(.+)$/u;
const ARBITRARY_UTILITY = /(?:[a-z][\w-]*-)?\[[^\]]+\]/u;

const DECLARATIONS: ReadonlyArray<{
  category: GovernedStyleCategory;
  pattern: RegExp;
  variablePrefix: string;
}> = [
  {
    category: "color",
    pattern: /(?:^|[;{\s])(?:color|background(?:-color|-image)?|border(?:-[\w-]+)?-color|outline-color|fill|stroke)\s*:\s*([^;}\n]+)/gu,
    variablePrefix: "color",
  },
  {
    category: "spacing",
    pattern: /(?:^|[;{\s])(?:margin(?:-[\w-]+)?|padding(?:-[\w-]+)?|gap|row-gap|column-gap)\s*:\s*([^;}\n]+)/gu,
    variablePrefix: "space",
  },
  {
    category: "radius",
    pattern: /(?:^|[;{\s])border-radius\s*:\s*([^;}\n]+)/gu,
    variablePrefix: "radius",
  },
  {
    category: "shadow",
    pattern: /(?:^|[;{\s])box-shadow\s*:\s*([^;}\n]+)/gu,
    variablePrefix: "shadow",
  },
];

function locationAt(content: string, index: number): { line: number; column: number } {
  const preceding = content.slice(0, index);
  const lines = preceding.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function tokenMembers(category: GovernedStyleCategory, tokens: GovernedTokenSet): readonly string[] {
  if (category === "color") return tokens.colors;
  if (category === "spacing") return tokens.spacing;
  if (category === "radius") return tokens.radii;
  return tokens.shadows;
}
/**
 * Suffixes that follow a colour-utility prefix but are not colours —
 * `text-center` is alignment, `text-balance` is text-wrap, and so on.
 * Exported so tests can avoid generating them as "invalid colour tokens".
 */
export const NON_COLOR_SUFFIXES = new Set([
  "left", "center", "right", "justify", "start", "end",
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
  "cover", "contain", "auto", "fixed", "local", "scroll", "clip", "origin", "repeat", "no-repeat",
  "gradient-to-t", "gradient-to-tr", "gradient-to-r", "gradient-to-br",
  "gradient-to-b", "gradient-to-bl", "gradient-to-l", "gradient-to-tl",
  "none", "transparent", "current", "inherit",
  "h1", "h2", "h3", "body",
  "wrap", "nowrap", "balance", "pretty",
]);
const NON_COLOR_BORDER_SUFFIXES = new Set(["0", "2", "4", "8", "x", "y", "t", "r", "b", "l"]);

function collectUtilityCandidates(content: string): Candidate[] {
  const candidates: Candidate[] = [];
  const strings = /(["'`])([\s\S]*?)\1/gu;
  for (const stringMatch of content.matchAll(strings)) {
    const value = stringMatch[2];
    const valueStart = (stringMatch.index ?? 0) + 1;
    for (const rawMatch of value.matchAll(/\S+/gu)) {
      const raw = rawMatch[0].replace(/^[{("'`]+|[)},;"'`]+$/gu, "");
      const utility = raw.split(":").at(-1) ?? raw;
      const index = valueStart + (rawMatch.index ?? 0);
      const color = utility.match(COLOR_UTILITY);
      const spacing = utility.match(SPACING_UTILITY);
      const radius = utility.match(RADIUS_UTILITY);
      const shadow = utility.match(SHADOW_UTILITY);

      if (
        color &&
        !NON_COLOR_SUFFIXES.has(color[1]) &&
        !(utility.startsWith("border-") && NON_COLOR_BORDER_SUFFIXES.has(color[1]))
      ) {
        candidates.push({ category: "color", value: utility, token: color[1], index });
      } else if (spacing) {
        candidates.push({ category: "spacing", value: utility, token: spacing[1], index });
      } else if (radius || utility === "rounded") {
        candidates.push({ category: "radius", value: utility, token: radius?.[1], index });
      } else if (shadow || utility === "shadow") {
        candidates.push({ category: "shadow", value: utility, token: shadow?.[1], index });
      } else if (ARBITRARY_UTILITY.test(utility)) {
        // Arbitrary values outside governed utility prefixes are dimensions or typography.
      }
    }
  }
  return candidates;
}

function isValidDeclaration(
  category: GovernedStyleCategory,
  value: string,
  variablePrefix: string,
  tokens: GovernedTokenSet,
): boolean {
  const allowed = tokenMembers(category, tokens);
  const variables = [...value.matchAll(/var\(--([\w-]+)\)/gu)].map((match) => match[1]);
  if (variables.length === 0) return /^(?:0|auto)(?:\s+(?:0|auto))*$/u.test(value.trim());
  const variablesValid = variables.every((variable) => {
    if (category === "color" && variable === "gradient-hero") return true;
    const prefix = `${variablePrefix}-`;
    return variable.startsWith(prefix) && allowed.includes(variable.slice(prefix.length));
  });
  const remainder = value.replace(/var\(--[\w-]+\)/gu, "").replace(/[\s,]/gu, "");
  return variablesValid && remainder.length === 0;
}
function collectDeclarationCandidates(content: string): Candidate[] {
  const candidates: Candidate[] = [];
  for (const declaration of DECLARATIONS) {
    declaration.pattern.lastIndex = 0;
    for (const match of content.matchAll(declaration.pattern)) {
      const value = match[1].trim();
      const valueOffset = match[0].lastIndexOf(match[1]);
      candidates.push({
        category: declaration.category,
        value,
        token: isValidDeclaration(
          declaration.category,
          value,
          declaration.variablePrefix,
          GOVERNED_TOKENS,
        )
          ? value
          : undefined,
        index: (match.index ?? 0) + valueOffset,
      });
    }
  }
  return candidates;
}

function isCandidateValid(candidate: Candidate, tokens: GovernedTokenSet): boolean {
  if (candidate.value.includes(":")) {
    const declaration = DECLARATIONS.find(({ category }) => category === candidate.category);
    return declaration
      ? isValidDeclaration(candidate.category, candidate.value, declaration.variablePrefix, tokens)
      : false;
  }
  if (candidate.token === candidate.value && candidate.value.startsWith("var(")) return true;
  if (candidate.token === undefined) return false;
  const members = tokenMembers(candidate.category, tokens);
  // Allow opacity modifiers on valid token colors (e.g. primary/10, surface-alt/80)
  if (candidate.category === "color") {
    const baseToken = candidate.token.replace(/\/\d+$/u, "").replace(/\/\[\d*\.?\d+\]$/u, "");
    if (baseToken !== candidate.token && members.includes(baseToken)) return true;
  }
  // Allow auto for spacing utilities (e.g. ml-auto, mx-auto)
  if (candidate.category === "spacing" && candidate.token === "auto") return true;
  // Allow arbitrary bracket values referencing design token CSS vars
  if (candidate.category === "spacing" && /^\[var\(--spacing-/u.test(candidate.token)) return true;
  if (candidate.category === "radius" && /^\[var\(--radius-/u.test(candidate.token)) return true;
  if (candidate.category === "shadow" && /^\[var\(--shadow-/u.test(candidate.token)) return true;
  if (candidate.category === "color" && /^\[var\(--color-/u.test(candidate.token)) return true;
  // Also allow var() references in arbitrary bracket syntax for any governed category
  if (/^\[var\(--(?:spacing|radius|shadow|color|gradient)-/u.test(candidate.token)) return true;
  return members.includes(candidate.token);
}

export function scanGovernedStyles(
  sources: readonly GovernedSource[],
  tokens: GovernedTokenSet = GOVERNED_TOKENS,
): GovernedStyleViolation[] {
  const violations: GovernedStyleViolation[] = [];
  for (const source of sources) {
    const declarationCandidates = collectDeclarationCandidates(source.content).map((candidate) => ({
      ...candidate,
      value: candidate.value,
      isDeclaration: true,
    }));
    const candidates = [...collectUtilityCandidates(source.content), ...declarationCandidates]
      .sort((left, right) => left.index - right.index);

    for (const candidate of candidates) {
      const isDeclaration = "isDeclaration" in candidate;
      const declaration = DECLARATIONS.find(({ category }) => category === candidate.category);
      const valid = isDeclaration && declaration
        ? isValidDeclaration(candidate.category, candidate.value, declaration.variablePrefix, tokens)
        : isCandidateValid(candidate, tokens);
      if (valid) continue;
      const { line, column } = locationAt(source.content, candidate.index);
      violations.push({
        file: source.path,
        line,
        column,
        category: candidate.category,
        value: candidate.value,
        message: `Non-token ${candidate.category} value "${candidate.value}".`,
      });
    }
  }
  return violations;
}
