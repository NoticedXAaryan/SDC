"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

import type { AudienceGroup } from "@/lib/landing/content/audience";

interface OrbitAudienceCardProps {
  audience: AudienceGroup;
  delay?: number;
}

export function OrbitAudienceCard({ audience, delay = 0 }: OrbitAudienceCardProps) {
  const reduceMotion = useReducedMotion();
  const Icon = audience.icon;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className="group relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-sm tablet:p-9"
      aria-label={audience.accessibleLabel}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full border border-violet-300/10 transition-transform duration-700 group-hover:scale-110" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

      <div className="relative flex items-start gap-5">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10 text-violet-200">
          <Icon size={27} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-2xl font-black tracking-tight text-white">{audience.title}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{audience.description}</p>
        </div>
      </div>

      <ul className="relative mt-7 grid gap-3 border-t border-white/10 pt-6">
        {audience.outcomes.map((outcome) => (
          <li key={outcome} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
              <Check size={14} strokeWidth={2.5} aria-hidden="true" />
            </span>
            {outcome}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
