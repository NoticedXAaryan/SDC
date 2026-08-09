# Project Brief — SDC

## What
SDC (Student Developer Club) is the web platform and public-facing website for the Student Developer Club. It serves two purposes:

1. **Club promotion & public presence** — The landing page, event listings, project showcase, and public certificate verification are all designed to promote the club to prospective members, the university, and the wider community. This is the club's website, not just an internal management tool.
2. **Club operations** — Behind login, it manages the full operational lifecycle: members, events, attendance, certificates, recruitment, finance, inventory, projects, forms, communications, and gamification.

## Who
- Built for Parul University's Student Developer Club
- Designed by Aaryan (NoticeXAaryan)
- Operated by club leadership (owner, admin, leads) for ~200+ members
- **Public audience:** Prospective members, university faculty, event attendees, certificate recipients

## Stack
Next.js 16 / React 19 / TypeScript / Drizzle ORM / PostgreSQL / Better Auth / BullMQ / Redis / Resend / Sentry / PostHog / Astryx UI / Tailwind CSS 4

## Design Direction
- **Theme:** Space / cosmic — the logo is a blackhole
- **Inspiration:** Comet Browser by Perplexity — cosmic visual language, planetary motifs, parabolic orbital lines, "space to Earth" visual journey
- **Gradients:** Replicate Comet's signature space gradients — deep dark backgrounds with celestial gradient accents (purples, blues, warm nebula tones fading into deep black)
- **Aesthetic:** Dark-mode-first, restrained with cosmic accent touches — not sci-fi-gaudy, more premium-observatory
- **Motion:** Subtle orbital/gravitational animations — elements that feel like they have weight and trajectory

## What's in scope
- All features listed in docs/ARCHITECTURE.md Section 7 (Feature Registry)
- 14-role RBAC hierarchy
- Background worker system (email, certificates, grading, reminders)
- Docker deployment
- Public-facing club website (landing page, events, projects, certificates)

## What's out of scope
- Face recognition, biometrics
- Payment processing
- WhatsApp integration
- Calendar sync
- Microservices architecture
