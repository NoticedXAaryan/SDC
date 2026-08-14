"use client";

import { FESTIVAL_HIGHLIGHTS } from "@/lib/landing/content";
import { InteractiveHighlightCard } from "./InteractiveHighlightCard";

export function HighlightsSection() {
  return (
    <section
      id="highlights"
      aria-labelledby="highlights-title"
      className="bg-canvas section-padding relative z-20"
    >
      <div className="site-container relative z-10">
        <header className="max-w-3xl mx-auto text-center">
          <p className="mb-3 font-black uppercase tracking-widest text-secondary drop-shadow-sm">
            Festival experiences
          </p>
          <h2 id="highlights-title" className="font-black text-4xl tablet:text-5xl text-ink drop-shadow-sm">
            Festival Highlights
          </h2>
          <div aria-hidden="true" className="brand-rule mx-auto mt-8 w-24 border-primary border-t-4" />
          <p className="mt-8 text-xl text-ink-muted font-medium max-w-2xl mx-auto drop-shadow-sm">
            Learn, compete, showcase your work, and meet the people building
            tomorrow&apos;s enterprises.
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
