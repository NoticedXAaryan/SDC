"use client";

import { FESTIVAL_HIGHLIGHTS } from "@/lib/landing/content";
import { InteractiveHighlightCard } from "./InteractiveHighlightCard";

export function HighlightsSection() {
  return (
    <section
      id="highlights"
      aria-labelledby="highlights-title"
      className="relative z-20 overflow-hidden bg-[#03040a] section-padding"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(99,102,241,0.15),transparent_34%)]" />
      <div className="site-container relative z-10">
        <header className="max-w-3xl mx-auto text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-violet-300">
            Explore the stack
          </p>
          <h2 id="highlights-title" className="text-4xl font-black tracking-tight text-white tablet:text-5xl">
            Programs with real gravity
          </h2>
          <div aria-hidden="true" className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400">
            Learn modern tools, ship useful projects, and grow alongside people
            who care about the craft.
          </p>
        </header>

        {/* Bento Grid Layout */}
        <div className="mt-16 grid grid-cols-1 gap-6 tablet:grid-cols-2 desktop:grid-cols-4">
          <InteractiveHighlightCard 
            highlight={FESTIVAL_HIGHLIGHTS[0]} 
            className="tablet:col-span-2 desktop:col-span-2 desktop:row-span-2" 
            delay={0.1}
          />
          <InteractiveHighlightCard 
            highlight={FESTIVAL_HIGHLIGHTS[1]} 
            className="tablet:col-span-1 desktop:col-span-2" 
            delay={0.2}
          />
          <InteractiveHighlightCard 
            highlight={FESTIVAL_HIGHLIGHTS[2]} 
            className="tablet:col-span-1 desktop:col-span-1" 
            delay={0.3}
          />
          <InteractiveHighlightCard 
            highlight={FESTIVAL_HIGHLIGHTS[3]} 
            className="tablet:col-span-2 desktop:col-span-1" 
            delay={0.4}
          />
          <InteractiveHighlightCard 
            highlight={FESTIVAL_HIGHLIGHTS[4]} 
            className="tablet:col-span-1 desktop:col-span-2" 
            delay={0.5}
          />
          <InteractiveHighlightCard 
            highlight={FESTIVAL_HIGHLIGHTS[5]} 
            className="tablet:col-span-1 desktop:col-span-2" 
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
}
