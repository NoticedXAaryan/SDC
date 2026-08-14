import Link from "next/link";
import { FESTIVAL_HIGHLIGHTS } from "@/lib/landing/content";
import type { Highlight } from "@/lib/landing/content";

export function LandingHighlights() {
  return (
    <section className="bg-canvas py-16 tablet:py-24" id="featured-events">
      <div className="site-container">
        <header className="mb-12">
          <p className="mb-2 font-semibold uppercase tracking-widest text-accent">
            What&apos;s Happening
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink tablet:text-4xl">
            Featured Events
          </h2>
          <div aria-hidden="true" className="brand-rule mt-4 w-16 text-accent/40" />
          <p className="mt-4 text-lg text-ink-muted max-w-2xl">
            Discover our core focus areas where students collaborate, learn, and grow.
          </p>
        </header>

        {/* Top 2 large cards */}
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 mb-4">
          {FESTIVAL_HIGHLIGHTS.slice(0, 2).map((event) => (
            <EventCard key={event.id} event={event} size="large" />
          ))}
        </div>

        {/* Bottom 4 in a 4-col grid on desktop */}
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          {FESTIVAL_HIGHLIGHTS.slice(2).map((event) => (
            <EventCard key={event.id} event={event} size="small" />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, size }: { event: Highlight; size: 'large' | 'small' }) {
  const heightClass = size === 'large' ? 'h-[420px] tablet:h-[480px]' : 'h-[280px] tablet:h-[320px]';

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl ${heightClass}`}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={event.imageUrl}
          alt={event.accessibleLabel || event.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Dark overlay — stronger on hover to make text readable */}
      <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/75" />

      {/* Content — name always visible, description appears on hover */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 tablet:p-6">
        <h3 className={`font-bold text-white ${size === 'large' ? 'text-2xl tablet:text-3xl' : 'text-base tablet:text-lg'}`}>
          {event.title}
        </h3>
        <p className="mt-2 text-sm text-white/80 leading-relaxed max-h-0 overflow-hidden transition-[max-height,opacity] duration-300 group-hover:max-h-24 opacity-0 group-hover:opacity-100">
          {event.description}
        </p>
      </div>
    </article>
  );
}
