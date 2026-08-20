import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Rocket } from "lucide-react";

import type { Viewer } from "@/lib/landing/auth-routing";

interface CtaBandProps {
  viewer: Viewer;
}

/**
 * Closing conversion band. Reuses the hero's scarlet field so the page opens
 * and closes on the brand colour.
 */
export function CtaBand({ viewer }: CtaBandProps) {
  const cta = viewer.authenticated
    ? { href: viewer.dashboardPath ?? "/dashboard/user", label: "Go to Dashboard" }
    : { href: "/register", label: "Register Now" };

  return (
    <section
      aria-labelledby="cta-title"
      className="relative overflow-hidden bg-primary bg-noise section-padding"
    >
      {/* Massive Rocket Imprint Background */}
      <Rocket 
        strokeWidth={1}
        className="absolute -bottom-24 -right-10 z-0 h-[600px] w-[600px] -rotate-12 text-surface opacity-10 pointer-events-none desktop:-right-24 desktop:h-[800px] desktop:w-[800px]" 
        aria-hidden="true" 
      />

      <div className="site-container relative z-10 flex flex-col items-center gap-12 desktop:flex-row desktop:justify-between desktop:items-center">
        
        {/* Left Column: Typography */}
        <div className="flex max-w-2xl flex-col items-center text-center desktop:items-start desktop:text-left">
          <h2
            id="cta-title"
            className="text-4xl font-extrabold tracking-tight text-surface tablet:text-5xl"
          >
            Ready to build the future? Join the club today.
          </h2>

          <div aria-hidden="true" className="brand-rule mt-8 w-24 text-surface/50" />

          <p className="mt-8 text-lg font-medium text-surface/85">
            Membership is completely free for all students of Parul University.
            Spots for special tech workshops are strictly limited.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 text-sm font-semibold text-surface tablet:flex-row tablet:gap-6 desktop:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-base font-extrabold text-primary shadow-[0_0_30px_rgba(255,255,255,0.3)] ring-4 ring-surface/20">
              <CalendarDays aria-hidden="true" size={20} />
              Weekly Sessions
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/10 px-4 py-2 border border-surface/20">
              <MapPin aria-hidden="true" className="text-accent" size={18} />
              Parul University Campus
            </span>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex w-full flex-col items-center gap-4 tablet:w-auto tablet:flex-row desktop:flex-col desktop:items-stretch">
          <Link
            href={cta.href}
            className="group inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-surface px-8 py-5 text-xl font-extrabold text-primary shadow-2xl transition-colors hover:bg-accent hover:text-ink tablet:w-auto desktop:w-full"
          >
            {cta.label}
            <ArrowRight
              aria-hidden="true"
              size={24}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
          <a
            href="#faq"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-xl border-2 border-surface/40 px-8 py-4 text-lg font-bold text-surface transition-colors hover:border-surface hover:bg-surface/10 tablet:w-auto desktop:w-full"
          >
            Read the FAQ
          </a>
        </div>
      </div>
    </section>
  );
}
