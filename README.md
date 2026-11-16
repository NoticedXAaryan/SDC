# SDC Platform

The website and operating system for [Parul University](https://paruluniversity.ac.in)'s Student Developer Club.

The public site introduces the club, publishes events, and verifies certificates. Behind login, members, leads, and faculty run the club: attendance, recruitment, finance, inventory, projects, and communications.

## Highlights

- **Public presence.** A dark, space-themed landing page, event listings, and a public certificate check at `/verify`.
- **Events and attendance.** Draft, approval, capacity, waitlist, multi-session events, QR passes, and a camera scanner with an offline queue.
- **Certificates.** Template design, bulk generation, email delivery, public verification, and revocation.
- **Recruitment.** Applications, interviews, and review. AI grading runs when an OpenRouter key is configured.
- **Club operations.** Budgets, expenses, procurement, inventory, forms, projects, announcements, and in-app notifications.
- **Access control.** Seventeen roles, from `applicant` and `user` through domain leads to `owner`, enforced in the data layer. University emails are promoted to `member` on signup.
- **Background work.** Redis queues for email, certificates, reminders, weekly reports, and grading.
- **Deployable as one stack.** Docker Compose runs the app, worker, Redis, and migrations. Uploads can stay on a volume or move to S3-compatible storage.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16.4 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, `@astryxdesign/core` |
| Data | PostgreSQL, Drizzle ORM |
| Auth | Better Auth, club role hierarchy |
| Jobs | BullMQ, Redis |
| Email | Resend, React Email |
| Observability | Sentry, PostHog |
| Deploy | Docker, standalone Next.js output |

## Status

This is a working club platform, not a signed production launch.

Checked on 16 November 2026:

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test` | Pass with PostgreSQL: 152 tests, including a second run on the same database. Integration files are skipped if the database is down. |
| `npm run build` | Pass on Next.js 16.4.6 |
| GitHub Actions on `main` | Last run succeeded on 26 August 2026 |

Still open:

- Launch sign-off in `docs/MAINTENANCE_STATUS.md` is **NO-GO**. Faculty approval, backup rehearsal, and the signed release record are not done.
- [Draft pull request #1](https://github.com/NoticedXAaryan/SDC/pull/1) (`codex/project-recovery`) continues account and membership work. It is not merged. Syncing it is a product decision, not a fast-forward.
- AI grading, email, Turnstile, Sentry, and PostHog stay idle until their keys are set.
- Social posting and WhatsApp are not connected. Face enrollment exists in settings; biometrics are out of scope and QR check-in is the supported path.
- Playwright specs exist under `tests/e2e`, but there is no npm script and CI does not run them. The visual snapshots were captured on Windows.

## Setup

Requirements: Node.js 22 or newer, PostgreSQL, and Redis.

```bash
npm install
cp .env.example .env.local
```

Set at least:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- `PASS_SECRET` (QR passes)
- `REDIS_URL` and `REDIS_PASSWORD`
- `ADMIN_EMAIL` (this address becomes `owner` on signup)

Then:

```bash
npm run db:push      # or npm run db:migrate
npm run db:seed      # optional development data
npm run dev          # http://localhost:3000
npm run worker       # second terminal, background jobs
```

Docker Compose is the production-shaped path. Copy `.env.example` to `.env`, point `DATABASE_URL` at a persistent Postgres instance, and run:

```bash
docker compose config --quiet
docker compose up --build
```

The migrator finishes before the app and worker start. Back up an existing database before the first migration. The migration script refuses to wipe a schema that has no Drizzle history.

`/api/health` is liveness. `/api/ready` checks the database and Redis. The worker exposes its own health endpoint on port 8080 inside Compose.

Local uploads (`STORAGE_DRIVER=local`) use the shared Compose volume. For more than one app instance, set `STORAGE_DRIVER=s3` and the `S3_*` variables.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Integration tests only run against a database whose name contains `test`. The default local URL is `postgresql://postgres:password@127.0.0.1:5432/sdc_test`. CI uses `club_test` on Postgres 16.

## Layout

| Path | Role |
| --- | --- |
| `app/` | Pages and thin API routes |
| `proxy.ts` | Auth redirect and request gates. Data access is checked again in the DAL. |
| `lib/dal/` | Business rules and queries |
| `lib/services/` | Mail, storage, certificates, audit |
| `lib/workers/` | BullMQ jobs |
| `lib/db/` | Drizzle schema |
| `drizzle/` | SQL migrations |
| `worker.ts` | Worker process entry |
| `docs/` | Specification, architecture, and the launch checklist |

New UI should use `@astryxdesign/core`. New queries belong in `lib/dal/`, and mutating actions should write an audit log.

## Documentation

- `docs/SPECIFICATION.md` — feature scope and what is explicitly out of scope
- `docs/ARCHITECTURE.md` — data flow, schema, and routes
- `docs/MAINTENANCE_STATUS.md` — launch decision and remaining blockers
- `docs/EXECUTION_ROADMAP.md` — verification checklist
