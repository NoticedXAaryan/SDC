import Image from "next/image";

import { prepareSpeakers, SPEAKER_PLACEHOLDER_IMAGE, type Speaker } from "@/lib/landing/content";

/**
 * SPEAKERS SECTION — Commented out / disabled for now.
 * This section is preserved and can be re-enabled in the future by:
 * 1. Uncommenting the <SpeakersSection> in app/page.tsx
 * 2. Adding speaker data to lib/landing/content/speakers.ts
 *
 * The design has been improved with:
 * - Dark theme consistent with the rest of the landing page
 * - Clean card layout with hover effects
 * - Proper image handling with fallback
 */

interface SpeakersSectionProps { speakers: readonly Speaker[] }

function displayText(value: string, maximum: number): { text: string; truncated: boolean } {
  const characters = Array.from(value);
  return characters.length > maximum
    ? { text: `${characters.slice(0, maximum - 1).join("")}…`, truncated: true }
    : { text: value, truncated: false };
}

export function SpeakersSection({ speakers }: SpeakersSectionProps) {
  const preparedSpeakers = prepareSpeakers(speakers);
  if (!preparedSpeakers) return null;

  return (
    <section id="speakers" aria-labelledby="speakers-title" className="bg-surface section-padding">
      <div className="site-container">
        <header className="max-w-3xl">
          <p className="mb-2 font-semibold uppercase tracking-widest text-accent">Meet the voices</p>
          <h2 id="speakers-title" className="font-bold text-ink">Speakers and Guests</h2>
          <div aria-hidden="true" className="brand-rule mt-6 w-20 text-accent/40" />
          <p className="mt-6 text-lg text-ink-muted">Discover the founders, innovators, and ecosystem leaders joining the festival.</p>
        </header>
        <div className="mt-12 grid grid-cols-2 gap-4 tablet:grid-cols-3 tablet:gap-6 desktop:grid-cols-4">
          {preparedSpeakers.map((speaker) => {
            const photo = speaker.photo ?? SPEAKER_PLACEHOLDER_IMAGE;
            const name = displayText(speaker.fullName, 50);
            const title = displayText(speaker.title, 60);
            const organization = displayText(speaker.organization, 60);
            return (
              <article key={speaker.id} className="min-w-0 overflow-hidden rounded-2xl border border-surface-alt bg-canvas shadow-sm transition-all hover:border-accent hover:shadow-md">
                <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="aspect-square w-full object-cover" />
                <div className="p-4 tablet:p-6">
                  <h3 className="truncate text-xl font-bold text-ink" title={name.truncated ? speaker.fullName : undefined}>{name.text}</h3>
                  <p className="mt-2 truncate font-semibold text-accent-strong" title={title.truncated ? speaker.title : undefined}>{title.text}</p>
                  <p className="mt-1 truncate text-ink-muted" aria-label={organization.truncated ? speaker.organization : undefined} title={organization.truncated ? speaker.organization : undefined}>{organization.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
