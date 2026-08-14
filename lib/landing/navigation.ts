export const FIXED_HEADER_OFFSET_PX = 80;
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface AnchorTarget {
  getBoundingClientRect(): { top: number };
}

export interface AnchorNavigationEnvironment {
  currentUrl: string;
  scrollY: number;
  prefersReducedMotion: boolean;
  getElementById(id: string): AnchorTarget | null;
  scrollTo(options: { top: number; behavior: ScrollBehavior }): void;
}

export function calculateAnchorDestination(
  targetViewportTop: number,
  currentScrollY: number,
  headerOffset = FIXED_HEADER_OFFSET_PX,
): number {
  return Math.max(0, targetViewportTop + currentScrollY - headerOffset);
}

export function sectionIdFromHash(hash: string): string | null {
  if (!hash.startsWith("#") || hash.length === 1) return null;

  try {
    const sectionId = decodeURIComponent(hash.slice(1));
    return sectionId.length > 0 ? sectionId : null;
  } catch {
    return null;
  }
}

export function getSamePageSectionId(href: string, currentUrl: string): string | null {
  try {
    const current = new URL(currentUrl);
    const destination = new URL(href, current);
    const isSameDocument =
      destination.origin === current.origin &&
      destination.pathname === current.pathname &&
      destination.search === current.search;

    return isSameDocument ? sectionIdFromHash(destination.hash) : null;
  } catch {
    return null;
  }
}

export function createBrowserNavigationEnvironment(): AnchorNavigationEnvironment | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  return {
    currentUrl: window.location.href,
    scrollY: window.scrollY,
    prefersReducedMotion: window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false,
    getElementById: (id) => document.getElementById(id),
    scrollTo: (options) => window.scrollTo(options),
  };
}

export function navigateToSection(
  sectionId: string,
  environment: AnchorNavigationEnvironment | null = createBrowserNavigationEnvironment(),
): boolean {
  if (!environment || sectionId.length === 0) return false;

  const target = environment.getElementById(sectionId);
  if (!target) return false;

  const top = calculateAnchorDestination(
    target.getBoundingClientRect().top,
    environment.scrollY,
  );
  environment.scrollTo({
    top,
    behavior: environment.prefersReducedMotion ? "auto" : "smooth",
  });
  return true;
}

/**
 * Enhances a same-document hash link when its target exists. Callers should
 * prevent the native link action only when this function returns true.
 */
export function enhanceHashNavigation(
  href: string,
  environment: AnchorNavigationEnvironment | null = createBrowserNavigationEnvironment(),
): boolean {
  if (!environment) return false;

  const sectionId = getSamePageSectionId(href, environment.currentUrl);
  return sectionId === null ? false : navigateToSection(sectionId, environment);
}