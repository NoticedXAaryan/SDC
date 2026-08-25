"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Orbit } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import GradualBlur from "@/components/ui/GradualBlur";
import type { Viewer } from "@/lib/landing/auth-routing";

interface HeroSectionProps {
  viewer: Viewer;
}

const TRACKS = ["Web", "Mobile", "AI / ML", "Design", "Open source"] as const;

export function HeroSection({ viewer }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const primaryAction = viewer.authenticated
    ? { href: viewer.dashboardPath ?? "/dashboard", label: "Open dashboard" }
    : { href: "/register", label: "Join the club" };

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate min-h-[94svh] overflow-hidden bg-[#020308] text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(139,92,246,.16), transparent 26%), radial-gradient(circle at 76% 52%, rgba(37,99,235,.13), transparent 31%), radial-gradient(rgba(255,255,255,.42) .6px, transparent .7px)",
          backgroundSize: "auto, auto, 42px 42px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-violet-500/[0.07] to-transparent"
      />

      <div className="site-container relative z-10 grid min-h-[94svh] items-center gap-12 pb-24 pt-32 desktop:grid-cols-[1.05fr_.95fr] desktop:pb-28 desktop:pt-28">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80 backdrop-blur-md">
            <Orbit size={14} aria-hidden="true" />
            Parul University · Student builder community
          </div>

          <h1
            id="hero-title"
            className="max-w-4xl text-[clamp(3.8rem,9vw,8.4rem)] font-semibold leading-[0.88] tracking-[-0.065em]"
          >
            Build beyond
            <span className="block bg-gradient-to-r from-white via-violet-200 to-blue-300 bg-clip-text text-transparent">
              the event horizon.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-7 text-slate-300 tablet:text-lg tablet:leading-8">
            Learn in public, ship ambitious projects, and find the people who
            make your ideas feel inevitable. SDC is where curious students grow
            into builders and leaders.
          </p>

          <div className="mt-9 flex flex-col gap-3 tablet:flex-row tablet:items-center">
            <Link
              href={primaryAction.href}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
            >
              {primaryAction.label}
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.035] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-violet-300/40 hover:bg-white/[0.07]"
            >
              Explore events
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-2" aria-label="Learning tracks">
            {TRACKS.map((track) => (
              <span
                key={track}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400"
              >
                {track}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-[620px] items-center justify-center desktop:justify-end">
          <div
            aria-label="Abstract black hole with a violet and blue accretion disk"
            role="img"
            className="relative aspect-square w-full"
          >
            <motion.div
              aria-hidden="true"
              className="absolute inset-[5%] rounded-full border border-violet-300/[0.08]"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-[15%] top-[11%] h-1.5 w-1.5 rounded-full bg-blue-200 shadow-[0_0_18px_5px_rgba(147,197,253,.45)]" />
              <span className="absolute bottom-[20%] right-[7%] h-1 w-1 rounded-full bg-violet-200 shadow-[0_0_16px_4px_rgba(196,181,253,.5)]" />
            </motion.div>
            <motion.div
              aria-hidden="true"
              className="absolute inset-[14%] rounded-full border border-dashed border-blue-200/[0.1]"
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 31, repeat: Infinity, ease: "linear" }}
            />

            <div
              aria-hidden="true"
              className="absolute inset-[16%] rounded-full bg-violet-500/15 blur-[72px]"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[17%] w-[91%] -translate-x-1/2 -translate-y-1/2 -rotate-[10deg] rounded-[50%] blur-[7px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent 2%, rgba(37,99,235,.2) 15%, rgba(125,211,252,.95) 36%, #fff 49%, rgba(196,181,253,.95) 58%, rgba(124,58,237,.38) 78%, transparent 98%)",
                boxShadow:
                  "0 0 36px rgba(99,102,241,.55), 0 0 100px rgba(76,29,149,.38)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[8%] w-[86%] -translate-x-1/2 -translate-y-1/2 -rotate-[10deg] rounded-[50%] bg-white/80 blur-[3px]"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_0_3px_rgba(255,255,255,.18),0_0_30px_8px_rgba(139,92,246,.32),inset_0_0_45px_rgba(0,0,0,1)]"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-100/20 blur-[1px]"
            />

            <div className="absolute bottom-[4%] left-1/2 flex -translate-x-1/2 items-center gap-5 whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-5 py-3 text-xs text-slate-300 backdrop-blur-xl">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} className="text-violet-300" aria-hidden="true" />
                Weekly sessions
              </span>
              <span className="h-4 w-px bg-white/10" aria-hidden="true" />
              <span className="inline-flex items-center gap-2">
                <MapPin size={14} className="text-blue-300" aria-hidden="true" />
                PU campus
              </span>
            </div>
          </div>
        </div>
      </div>

      <GradualBlur
        target="parent"
        position="bottom"
        height="7rem"
        strength={2.2}
        divCount={6}
        curve="ease-out"
        opacity={0.72}
      />
    </section>
  );
}
