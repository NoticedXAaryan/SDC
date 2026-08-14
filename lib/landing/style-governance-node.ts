import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  scanGovernedStyles,
  type GovernedSource,
  type GovernedStyleViolation,
} from "./style-governance";

const ROOT_LANDING_FILES = [] as const;

const AUTH_ROUTE_DIRECTORIES = [
  "login",
  "signup",
  "forgot-password",
  "reset-password",
] as const;

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(entryPath);
      return /\.(?:css|tsx?)$/u.test(entry.name) && !entry.name.includes(".test.")
        ? [entryPath]
        : [];
    }),
  );
  return files.flat();
}

export async function findLandingAuthSourceFiles(projectRoot: string): Promise<string[]> {
  const candidates = [path.join(projectRoot, "app", "page.tsx")];
  candidates.push(
    ...ROOT_LANDING_FILES.map((file) => path.join(projectRoot, "components", file)),
  );
  for (const directory of AUTH_ROUTE_DIRECTORIES) {
    candidates.push(...(await collectSourceFiles(path.join(projectRoot, "app", directory))));
  }
  candidates.push(...(await collectSourceFiles(path.join(projectRoot, "components", "landing"))));
  candidates.push(...(await collectSourceFiles(path.join(projectRoot, "components", "auth"))));

  const unique = [...new Set(candidates)];
  const existing = await Promise.all(
    unique.map(async (file) => {
      const readable = await readFile(file, "utf8").then(() => true).catch(() => false);
      return readable ? file : null;
    }),
  );
  return existing.filter((file): file is string => file !== null);
}

export async function scanLandingAuthSources(
  projectRoot: string,
): Promise<GovernedStyleViolation[]> {
  const files = await findLandingAuthSourceFiles(projectRoot);
  const sources: GovernedSource[] = await Promise.all(
    files.map(async (file) => ({ path: file, content: await readFile(file, "utf8") })),
  );
  return scanGovernedStyles(sources);
}
