'use client';

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";

import type { Viewer } from "@/lib/landing/auth-routing";
import { MobileNavigationController } from "./MobileNavigationController";
import { cn } from "@/lib/utils";

export interface SiteHeaderProps {
  viewer: Viewer;
}

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Highlights", href: "#highlights" },
  { label: "Schedule", href: "#schedule" },
  { label: "FAQ", href: "#faq" },
] as const;

export function SiteHeader({ viewer }: SiteHeaderProps) {
  // "top" → transparent, floats over the hero
  // "floating" → condensed glass pill
  // "hidden" → tucked away while scrolling down
  const [navState, setNavState] = useState<"top" | "floating" | "hidden">("top");
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;

    if (latest <= 40) {
      setNavState("top");
    } else if (latest > previous && latest > 100) {
      setNavState("hidden");
    } else if (latest < previous) {
      setNavState("floating");
    }
  });

  const isScrolled = navState === "floating";
  const isHidden = navState === "hidden";

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
      <motion.header
        initial={false}
        animate={{
          width: isScrolled ? "min(94%, 64rem)" : "100%",
          y: isHidden ? -120 : isScrolled ? 14 : 0,
          borderRadius: isScrolled ? 999 : 0,
          // Glass, not a black slab: transparent at rest, lightly frosted once condensed.
          backgroundColor: isScrolled
            ? "rgba(255, 255, 255, 0.98)"
            : "rgba(255, 255, 255, 0)",
          borderColor: isScrolled
            ? "rgba(0, 0, 0, 0.08)"
            : "rgba(0, 0, 0, 0)",
          boxShadow: isScrolled
            ? "0 10px 30px -10px rgba(0, 0, 0, 0.15)"
            : "0 0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className={cn(
          "pointer-events-auto border sticky top-0 z-50",
          isScrolled && "backdrop-blur-xl backdrop-saturate-150"
        )}
      >
        <div
          className={cn(
            "site-container flex items-center justify-between gap-4 transition-all duration-300",
            isScrolled ? "h-14 px-5 tablet:px-6" : "h-20 px-4 tablet:px-8"
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <img
              src="/logo.jpg"
              alt="SDC Parul University"
              className={cn(
                "w-auto object-contain transition-all duration-300",
                isScrolled ? "h-8" : "h-10 tablet:h-12"
              )}
            />
            <span className="sr-only">SDC PU</span>
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className={cn(
              "hidden desktop:flex items-center transition-all duration-300",
              isScrolled ? "gap-7" : "gap-8"
            )}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "group relative py-1.5 font-bold transition-colors",
                  isScrolled ? "text-ink hover:text-primary text-[14px]" : "text-surface/90 hover:text-surface text-sm"
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                />
              </a>
            ))}
          </nav>

          {/* Desktop auth actions */}
          <div className="hidden desktop:flex items-center gap-4">
            {viewer.authenticated ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2"
                aria-label="Dashboard"
              >
                {viewer.image ? (
                  <img
                    src={viewer.image}
                    alt=""
                    aria-hidden="true"
                    className={cn(
                      "rounded-pill border border-surface-alt object-cover transition-all duration-300 group-hover:border-accent",
                      isScrolled ? "h-8 w-8" : "h-9 w-9"
                    )}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "flex items-center justify-center rounded-pill bg-primary font-bold text-surface transition-all duration-300 group-hover:bg-primary-strong",
                      isScrolled ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
                    )}
                  >
                    {viewer.name ? viewer.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "font-bold transition-colors",
                    isScrolled ? "text-ink hover:text-primary text-[14px]" : "text-surface/90 hover:text-surface text-sm"
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    "inline-flex items-center justify-center rounded-pill font-bold transition-colors",
                    isScrolled ? "bg-primary text-surface hover:bg-primary-strong px-5 py-2 text-[13px]" : "bg-surface text-primary hover:bg-surface-alt px-6 py-2.5 text-sm"
                  )}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            className={cn(
              "desktop:hidden flex min-h-touch min-w-touch items-center justify-center rounded-pill transition-colors",
              isScrolled ? "text-ink-muted hover:text-ink" : "text-surface/80 hover:text-surface"
            )}
            data-mobile-nav-trigger
          >
            <Menu size={24} aria-hidden="true" />
          </button>
        </div>
      </motion.header>

      {/* Mobile overlay */}
      <MobileNavigationController viewer={viewer} />
    </div>
  );
}
