"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "motion/react";
import type { Viewer } from "@/lib/landing/auth-routing";
import { FESTIVAL_STATISTICS } from "@/lib/landing/content";
import { Meteors } from "@/components/ui/meteors";

interface HeroSectionProps {
  viewer: Viewer;
}

const HERO_IMAGE = "/hero-crowd.jpg";

const TRACK_FILTERS = [
  { label: "Web Dev", href: "#events" },
  { label: "App Dev", href: "#events" },
  { label: "AI/ML", href: "#events" },
  { label: "UI/UX", href: "#events" },
  { label: "Open Source", href: "#events" },
] as const;

const KNOCKOUT_CLASS =
  "bg-clip-text text-transparent bg-cover bg-center bg-no-repeat";

const KNOCKOUT_STYLE: React.CSSProperties = {
  backgroundImage: `url(${HERO_IMAGE})`,
  WebkitTextStroke: "1px rgba(0,0,0,0.14)",
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 },
  },
};

export function HeroSection({ viewer }: HeroSectionProps) {
  const cta = viewer.authenticated
    ? { href: viewer.dashboardPath ?? "/dashboard/user", label: "Go to Dashboard" }
    : { href: "/signup", label: "Register Now" };

  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const spotlightX = useMotionTemplate`calc(${smoothX}px - 600px)`;
  const spotlightY = useMotionTemplate`calc(${smoothY}px - 600px)`;

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (!sectionRef.current) return;
    const { left, top } = sectionRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      id="hero"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-primary min-h-screen"
    >
      {/* Reactive Spotlight */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-0 h-[1200px] w-[1200px] rounded-full"
        style={{ 
          x: spotlightX,
          y: spotlightY,
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)",
          willChange: "transform",
        }}
      />

      <Meteors number={20} />

      <div className="site-container relative z-10 pt-24 tablet:pt-32 desktop:pt-28 pb-14">
        <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col-reverse desktop:flex-row desktop:items-start desktop:justify-between gap-12 desktop:gap-8">
          
          {/* Left Column: Main content */}
          <div className="flex-1 max-w-4xl">
            {/* ── Knockout headline ── */}
          <motion.h1
            variants={item}
            id="hero-title"
            className="font-black uppercase leading-[0.84] tracking-[-0.03em] text-4xl tablet:text-5xl desktop:text-6xl"
          >
            {/* Accessible label, since the visible glyphs are image-filled */}
            <span className="sr-only">Goa Startup Festival 2026</span>

            <span aria-hidden="true" className="flex flex-wrap items-center gap-x-4">
              <span className="inline-block rounded-2xl bg-[#005ce6] px-[0.15em] py-[0.05em] text-[clamp(2.5rem,10vw,8rem)] leading-[0.84] text-surface mix-blend-normal shadow-sm">
                STUDENT
              </span>
              <span
                className="text-[clamp(3.25rem,15vw,11rem)] text-white"
              >
                DEVELOPER
              </span>
            </span>

            <span aria-hidden="true" className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span
                className="text-[clamp(3.25rem,15vw,11rem)] text-white"
              >
                Club
              </span>
              <span className="text-[clamp(2rem,7vw,5rem)] font-black tracking-tight text-accent-strong">
                PU
              </span>
            </span>
          </motion.h1>

          <motion.div
            variants={item}
            aria-hidden="true"
            className="brand-rule mt-8 w-24 text-accent/50"
          />

          {/* Content moved to full-width bottom panel */}
        </div>

        {/* Right Column: Rocket Graphic */}
        <motion.div 
          variants={item} 
          className="hidden desktop:flex flex-col items-end pt-12"
        >
          {/* Animated Premium SVG Rocket */}
            <motion.svg
              initial={{ y: 0, x: 0, rotate: 12, scale: 1, opacity: 1 }}
              animate={{ 
                y: [0, -20, 0, -20, -1000, 1000, 0], 
                x: [0, 10, 0, 10, 500, -500, 0],
                scale: [1, 1, 1, 1, 0.4, 0.4, 1],
                rotate: [12, 15, 12, 15, 45, 45, 12],
                opacity: [1, 1, 1, 1, 0, 0, 1]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity, 
                times: [0, 0.2, 0.4, 0.6, 0.75, 0.76, 1],
                ease: "easeInOut" 
              }}
              viewBox="0 0 256 320"
              className="w-48 h-48 tablet:w-72 tablet:h-72 desktop:w-96 desktop:h-96 mr-4 mt-8 drop-shadow-2xl"
              style={{ willChange: "transform", overflow: "visible" }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="rocketBody" x1="128" y1="16" x2="128" y2="196" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E0E0E0" />
                </linearGradient>
                <linearGradient id="rocketNose" x1="128" y1="16" x2="128" y2="106" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
                <linearGradient id="flame" x1="128" y1="146" x2="128" y2="256" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              {/* Left Fin */}
              <path d="M78 186L28 226V256L98 226V186Z" fill="#EF4444" opacity="0.9"/>
              <path d="M78 186L60 215V230L90 215V186Z" fill="#7F1D1D" opacity="0.5"/>
              {/* Right Fin */}
              <path d="M178 186L228 226V256L158 226V186Z" fill="#EF4444" opacity="0.9"/>
              <path d="M178 186L196 215V230L166 215V186Z" fill="#7F1D1D" opacity="0.5"/>
              {/* Animated Flames */}
              <motion.g
                animate={{
                  scaleY: [1, 0.9, 1, 0.9, 1.2, 1.2, 1],
                  scaleX: [1, 0.95, 1, 0.95, 1.1, 1.1, 1],
                  opacity: [0.8, 1, 0.8, 1, 1, 1, 0.8]
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  times: [0, 0.2, 0.4, 0.6, 0.75, 0.76, 1],
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: "128px 196px" }}
              >
                {/* Flame Outer */}
                <path d="M128 256C128 256 88 206 88 146C88 86 128 56 128 56C128 56 168 86 168 146C168 206 128 256 128 256Z" fill="url(#flame)"/>
                {/* Flame Inner */}
                <path d="M128 236C128 236 108 196 108 156C108 116 128 96 128 96C128 96 148 116 148 156C148 196 128 236 128 236Z" fill="#FEF08A"/>
              </motion.g>
              {/* Main Body */}
              <path d="M128 16C68 86 78 196 78 196H178C178 196 188 86 128 16Z" fill="url(#rocketBody)"/>
              {/* Body Highlight */}
              <path d="M128 16C80 86 85 196 85 196H128V16Z" fill="#FFFFFF" opacity="0.6"/>
              {/* Nose Cone */}
              <path d="M128 16C105.5 40 91.5 70 85 106H171C164.5 70 150.5 40 128 16Z" fill="url(#rocketNose)"/>
              {/* Nose Highlight */}
              <path d="M128 16C110 40 98 70 94 106H128V16Z" fill="#FCA5A5" opacity="0.6"/>
              {/* Window Outer */}
              <circle cx="128" cy="126" r="24" fill="#9CA3AF"/>
              {/* Window Inner */}
              <circle cx="128" cy="126" r="18" fill="#1E3A8A"/>
              {/* Window reflection */}
              <path d="M136 114A18 18 0 0 0 114 136A18 18 0 0 1 136 114Z" fill="#93C5FD" opacity="0.8"/>
            </motion.svg>
          </motion.div>

        </motion.div>

        {/* BOTTOM SECTION: Content & Actions Panel */}
        <motion.div variants={item} initial="hidden" animate="visible" className="mt-12 desktop:mt-20 w-full flex flex-col gap-10">
          
          {/* Subtitle & Tracks Row */}
          <div className="flex flex-col desktop:flex-row desktop:items-center justify-between gap-8 border-b border-surface/20 pb-8">
            <div className="max-w-2xl">
              <p className="text-2xl font-bold text-surface tracking-tight leading-snug">
                Where students become developers, designers, and leaders.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-surface/80">
                Workshops, hackathons, open-source events, and a vibrant community of tech enthusiasts.
              </p>
            </div>
            
            {/* Track filter rail */}
            <ul aria-label="Programme tracks" className="flex flex-wrap desktop:justify-end gap-3 max-w-xl">
              {TRACK_FILTERS.map((track) => (
                <li key={track.label}>
                  <a
                    href={track.href}
                    className="inline-flex items-center rounded-full border border-surface/20 bg-primary-strong/30 backdrop-blur-md px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-surface hover:text-primary shadow-sm"
                  >
                    {track.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions & Meta Row */}
          <div className="flex flex-col desktop:flex-row desktop:items-center justify-between gap-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 tablet:p-8">
            <div className="flex flex-col gap-5 text-base font-medium text-surface">
              <span className="inline-flex items-center gap-4">
                <div className="p-2.5 rounded-full bg-accent/20 text-accent"><CalendarDays size={20} /></div>
                Weekly Workshops & Events
              </span>
              <span className="inline-flex items-center gap-4">
                <div className="p-2.5 rounded-full bg-accent/20 text-accent"><MapPin size={20} /></div>
                Parul University Campus
              </span>
            </div>

            <div className="flex flex-col w-full desktop:w-auto gap-4">
              <Link
                href={cta.href}
                className="group w-full inline-flex items-center justify-center gap-3 rounded-full bg-surface px-8 py-4 text-lg font-extrabold text-primary transition-colors hover:bg-surface-alt shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {cta.label}
                <ArrowRight aria-hidden="true" size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="flex flex-col tablet:flex-row w-full gap-4">
                <a
                  href="#schedule"
                  className="flex-1 inline-flex items-center justify-center rounded-full border border-surface/30 bg-white/5 backdrop-blur-md px-6 py-4 text-base font-bold text-surface transition-colors hover:bg-white/10 hover:border-surface shadow-sm whitespace-nowrap"
                >
                  Explore Schedule
                </a>
                <a
                  href="/brochure.pdf"
                  download
                  className="flex-1 inline-flex items-center justify-center rounded-full border border-surface/30 bg-white/5 backdrop-blur-md px-6 py-4 text-base font-bold text-surface transition-colors hover:bg-white/10 hover:border-surface shadow-sm whitespace-nowrap"
                >
                  Download Brochure
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Full-bleed photo band, echoing the editorial strip ── */}
      <motion.div
        variants={item}
        initial="hidden"
        animate="visible"
        aria-hidden="true"
        className="relative z-10 mt-4 h-[26vw] min-h-[150px] w-full bg-cover bg-center bg-no-repeat tablet:h-[22vw] tablet:max-h-[340px]"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
        }}
      />

      {/* ── Stats strip ── */}
      <div className="site-container relative z-10 pb-16 pt-10 tablet:pb-20">
        <motion.div
          variants={item}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-surface-alt bg-surface p-7 shadow-sm"
        >
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted desktop:text-left">
            Our Community Impact
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-7 desktop:grid-cols-4">
            {FESTIVAL_STATISTICS.map((statistic) => (
              <div key={statistic.label} className="text-center desktop:text-left">
                <dd className="text-3xl font-black leading-none tracking-tighter text-ink tablet:text-4xl">
                  {statistic.value}
                </dd>
                <dt className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">
                  {statistic.label}
                </dt>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
