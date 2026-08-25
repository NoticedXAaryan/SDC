"use client";

import { FESTIVAL_AUDIENCES } from "@/lib/landing/content";
import { OrbitAudienceCard } from "./OrbitAudienceCard";

/**
 * "Who it's for" section — A dynamic, interactive sky with floating clouds.
 */
export function AudienceSection() {
  return (
    <section
      id="audience"
      aria-labelledby="audience-title"
      className="relative z-10 overflow-hidden bg-[#050611] section-padding"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(59,130,246,0.13),transparent_30%),radial-gradient(circle_at_80%_65%,rgba(124,58,237,0.16),transparent_34%)]" />

      <div className="site-container relative z-10">
        <header className="mx-auto mb-16 max-w-3xl text-center tablet:mb-20">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">
            Who it&apos;s for
          </p>
          <h2 id="audience-title" className="text-4xl font-black tracking-tight text-white tablet:text-5xl">
            Find your orbit
          </h2>
          <div aria-hidden="true" className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400">
            Whether you are opening your first editor or already leading a team,
            there is a place to learn, contribute, and build momentum.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 tablet:grid-cols-2">
          {FESTIVAL_AUDIENCES.map((audience, index) => {
            return (
              <OrbitAudienceCard key={audience.id} audience={audience} delay={index * 0.08} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
