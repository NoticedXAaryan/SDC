# Active Context

## Current Phase: Implementation & Stabilization
- **Completed**: Fixed IDOR vulnerabilities in Event endpoints, established secure initial bootstrap (`/api/setup` endpoint), added dummy data scripts with automated cleanup (`[DUMMY]` tags), and integrated Resend mailer with a background worker (BullMQ) for async email dispatch.
- **In Progress**: Frontend UI Re-design (Phase 7-9 of original PRD plan). The backend is now fully stable.
- **Next Steps**: Begin updating `app/globals.css` and the dashboard layouts with premium UI tokens as defined in the Frontend Redesign plan.
- **Open Topics**: Cal.com scheduling features are deferred to a later project phase.

## Environment Notes
- **Dokploy**: Standalone Docker builds strip development dependencies (like `tsx`), so one-time scripts must be exposed via Next.js API endpoints or pre-compiled.
- **Database**: The local `.env.local` points to the *production* Neon DB, so caution must be used when seeding. Use the `npm run db:clean` script to clear out test artifacts.
