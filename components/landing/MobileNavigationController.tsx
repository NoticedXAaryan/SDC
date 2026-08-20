"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import type { Viewer } from "@/lib/landing/auth-routing";
import {
  enhanceHashNavigation,
  REDUCED_MOTION_QUERY,
} from "@/lib/landing/navigation";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Highlights", href: "#highlights" },
  { label: "Schedule", href: "#schedule" },
  { label: "FAQ", href: "#faq" },
] as const;

const OVERLAY_DURATION_MS = 300;
const DESKTOP_BREAKPOINT = "(min-width: 64rem)";

export interface MobileNavigationControllerProps {
  viewer: Viewer;
}

/**
 * MobileNavigationController — "use client" island.
 *
 * Provides the full-screen modal overlay for navigation below the 1024px
 * desktop breakpoint. Features:
 * - Full-screen overlay with role="dialog" and aria-modal="true"
 * - Accessible close button with aria-label
 * - Focus trap: Tab/Shift+Tab cycle within dialog
 * - Focus return: on close, returns focus to the opener (hamburger trigger)
 * - Escape key closes the overlay
 * - 300ms fade animation (no animation when prefers-reduced-motion)
 * - Same-page hash links scroll with 80px offset via enhanceHashNavigation
 * - Clicking a link closes the overlay
 * - Breakpoint change to desktop (>=1024px) closes the overlay
 * - Body scroll lock while open (reversible)
 *
 * Requirements: 3.3, 3.7, 3.8, 3.10, 12.3, 12.5, 13.4, 13.6
 */
export function MobileNavigationController({
  viewer,
}: MobileNavigationControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef<string>("");

  // ─── Open ────────────────────────────────────────────────────────────
  const open = useCallback(() => {
    // Record the opener element for focus return
    triggerRef.current = document.querySelector(
      "[data-mobile-nav-trigger]",
    ) as HTMLElement | null;

    // Lock body scroll (reversible)
    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const prefersReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (prefersReduced) {
      // No animation — mount immediately in final state
      setIsVisible(true);
      setIsOpen(true);
    } else {
      // Start fade-in
      setIsVisible(true);
      setIsAnimating(true);
      // Next frame: trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(true);
          setTimeout(() => setIsAnimating(false), OVERLAY_DURATION_MS);
        });
      });
    }
  }, []);

  // ─── Close ───────────────────────────────────────────────────────────
  const close = useCallback(() => {
    const prefersReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (prefersReduced) {
      // No animation — unmount immediately
      setIsOpen(false);
      setIsVisible(false);
      document.body.style.overflow = previousOverflowRef.current;
      triggerRef.current?.focus();
    } else {
      // Start fade-out
      setIsAnimating(true);
      setIsOpen(false);
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        document.body.style.overflow = previousOverflowRef.current;
        triggerRef.current?.focus();
      }, OVERLAY_DURATION_MS);
    }
  }, []);

  // ─── Listen for hamburger trigger clicks ─────────────────────────────
  useEffect(() => {
    const trigger = document.querySelector(
      "[data-mobile-nav-trigger]",
    ) as HTMLElement | null;

    if (!trigger) return;

    const handleTriggerClick = () => open();
    trigger.addEventListener("click", handleTriggerClick);
    return () => trigger.removeEventListener("click", handleTriggerClick);
  }, [open]);

  // ─── Focus trap + Escape handling ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    // Move focus to close button on open
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "Tab") {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const focusableElements = overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // ─── Breakpoint close: auto-close on desktop ─────────────────────────
  useEffect(() => {
    if (!isVisible) return;

    const mql = window.matchMedia(DESKTOP_BREAKPOINT);

    const handleBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Transitioning to desktop — close overlay immediately
        setIsOpen(false);
        setIsVisible(false);
        setIsAnimating(false);
        document.body.style.overflow = previousOverflowRef.current;
        triggerRef.current?.focus();
      }
    };

    mql.addEventListener("change", handleBreakpoint);
    return () => mql.removeEventListener("change", handleBreakpoint);
  }, [isVisible]);

  // ─── Cleanup body overflow on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = previousOverflowRef.current;
      }
    };
  }, []);

  // ─── Link click handler ──────────────────────────────────────────────
  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // For hash links, enhance with offset scrolling
      if (href.startsWith("#")) {
        e.preventDefault();
        close();
        // Scroll after close to ensure body scroll is restored
        const prefersReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
        const delay = prefersReduced ? 0 : OVERLAY_DURATION_MS;
        setTimeout(() => {
          enhanceHashNavigation(href);
        }, delay);
      } else {
        // Regular links (Login, Register, Dashboard) — close overlay
        close();
      }
    },
    [close],
  );

  // ─── Render ──────────────────────────────────────────────────────────
  if (!isVisible) return null;

  const overlayOpacity = isOpen && !isAnimating ? 1 : isOpen ? 1 : 0;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className="fixed inset-0 z-[100] flex flex-col bg-surface pointer-events-auto"
      style={{
        opacity: overlayOpacity,
        transition:
          isAnimating
            ? `opacity ${OVERLAY_DURATION_MS}ms ease-out`
            : undefined,
      }}
    >
      {/* Header with close button */}
      <div className="flex h-20 items-center justify-between px-4">
        <span className="text-xl font-bold tracking-tight text-ink">
          SDC
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close navigation menu"
          onClick={close}
          className="flex items-center justify-center min-h-touch min-w-touch text-ink-muted transition-colors hover:text-ink"
        >
          <X size={24} aria-hidden="true" />
        </button>
      </div>

      {/* Navigation links */}
      <nav
        aria-label="Mobile navigation"
        className="flex flex-1 flex-col items-center justify-center gap-8"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => handleLinkClick(e, link.href)}
            className="text-2xl font-medium text-ink transition-colors hover:text-primary"
          >
            {link.label}
          </a>
        ))}

        {/* Auth links */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {viewer.authenticated ? (
            <Link
              href="/dashboard"
              onClick={(e) => handleLinkClick(e, "/dashboard")}
              className="flex items-center gap-3 rounded-pill border border-surface-alt bg-surface-alt/50 pl-2 pr-6 py-2 transition-colors hover:border-primary"
            >
              {/* Avatar is decorative: the adjacent "Dashboard" label names the link. */}
              {viewer.image ? (
                <img
                  src={viewer.image}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 rounded-pill object-cover border border-surface-alt"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-pill bg-primary/10 text-base font-semibold text-primary border border-primary/20"
                >
                  {viewer.name ? viewer.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <span className="text-lg font-medium text-ink transition-colors">
                Dashboard
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={(e) => handleLinkClick(e, "/login")}
                className="text-lg font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={(e) => handleLinkClick(e, "/register")}
                className="inline-flex items-center justify-center rounded-pill bg-primary px-8 py-3 text-lg font-semibold text-surface shadow-sm transition-colors hover:bg-primary-strong"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
