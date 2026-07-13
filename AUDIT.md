# Project Audit — stc-os
Generated: 2026-07-13 | Agent: Gemini 3.1 Pro | Scope: full repo

## 1. Executive Summary
**SDC OS (Student Developer Club Operating System)** is a comprehensive, professional-grade internal platform designed to manage the entire lifecycle of a student developer club. It acts as the central nervous system for the organization, handling everything from public-facing event registrations to internal financial tracking, inventory management, and member recruitment. 

The application is built on a modern Next.js 16 (App Router) full-stack architecture using Drizzle ORM, Better Auth for granular role-based access control, and BullMQ for reliable background job processing. While the core architecture and stack are solid and modern, the backend suffers from systemic inconsistencies in error handling, rate limiting, and some missing authorization checks.
**Top Findings:**
1. **Error Handling & Rate Limiting Bypass:** 45 API routes implement redundant `try { ... } catch { return NextResponse.json({error}) }` blocks inside `withApiHandler`, effectively swallowing internal errors and preventing the global wrapper from correctly handling Zod `ValidationError` and `AuthorizationError`.
2. **Missing Rate Limiting:** 3 mutating routes bypass the `withApiHandler` wrapper entirely, exposing them to brute-force or spam.
3. **Missing Auth Checks:** 5 routes lack `requireSession` or `requireRole` checks, some of which may be intentionally public (e.g. `/api/health`, `/api/content/calendar`), but others need strict verification.
4. **Pagination Bugs:** Endpoint like `/api/events` fetch the total count of rows without applying the search/filter conditions, leading to inaccurate pagination totals.

## 2. System Overview
**Architecture Flow:**
- **Client:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Shadcn UI
- **Server:** Next.js API Routes (`/app/api`) & Server Actions (`/lib/actions`).
- **Database:** PostgreSQL accessed via Drizzle ORM.
- **Auth:** Better Auth + Google OAuth.
- **Background Jobs:** BullMQ + Redis (ioredis) for background processing.
- **Other:** Resend (Email), Sentry (Monitoring), Posthog (Analytics).

**Directory Map:**
- `/app`: Next.js App Router (pages, layouts, and API routes).
- `/components`: Reusable UI components (mostly Shadcn).
- `/lib`: Core business logic, DB schema, auth config, background queues, utility functions.
- `/drizzle`: Database migration files.
- `/emails`: Email templates (React Email).
- `/scripts`: Bootstrap, seed, clean, and migrate scripts.
- `/docs`: Documentation.
- `/tests`: Vitest test suites.

## 3. Feature Inventory
- **Auth & Member Management (Better Auth):** Core identity provider handling Google OAuth and local credentials. It enforces granular Role-Based Access Control (RBAC) with roles like `owner`, `admin`, `lead`, `co_lead`, and `member`. Secures internal domains and siloes data access. Working.
- **Event & Attendance Management:** A robust system to create, publish, and track events. Features include public/private visibility, ticketing (paid/free), capacity limits, guest registrations, and native QR code scanning for fast, contactless check-ins at the door. Partially working (bugs in pagination and rate limit inconsistencies).
- **Recruitment & Applicant Tracking:** An end-to-end pipeline for club recruitment. It captures applications, triggers automated AI grading (via OpenRouter/LLMs) to screen candidates, and manages interview scheduling and status tracking (draft -> interviewing -> accepted/rejected). Working.
- **Certificate Generation:** Automated PDF certificate generation for event attendees. Uses `@pdfme` to generate visually appealing certificates, offloaded to BullMQ background workers to ensure the main thread isn't blocked during mass-issuance. Working.
- **Finance & Budgeting:** Internal accounting tools to track event budgets, log expenses, and record incomes. Essential for club leads to maintain financial transparency and manage procurement requests. Working.
- **Inventory & Asset Tracking:** A complete ledger for physical club assets (e.g., hardware, merchandise). Logs check-ins and check-outs, preventing loss and maintaining accountability across the team. Working.
- **Admin & Custom Forms:** A dynamic form builder for creating application cycles and internal surveys, streamlining data collection without needing hardcoded frontend changes. Working.

## 4. Backend Deep-Dive
- **API Wrapper (`withApiHandler`):** Implements rate limiting and global error handling for `AuthorizationError` and `ValidationError`. 
- **Validation:** Strong usage of Zod schemas on most endpoints.
- **Auth:** `requireRole` and `requireSession` used correctly in most endpoints, but some missing entirely.
- **Database:** Good usage of Drizzle. Some missing transaction wrappers on complex mutations. Need to check for N+1 queries.

## 5. Data Layer
Schema uses Drizzle ORM. 
- **Models:** User, Session, Organization, Events, Registrations, EventSessions, SessionAttendance, Certificates, Tasks, Budgets, Expenses, Inventory, Projects, Applications, Interviews, AI Logs, etc.
- **Health:** Clean schema with appropriate relations and indexes.

## 6. Auth & Security
- **Better Auth:** Integrated with `drizzleAdapter` and `admin` plugin for robust RBAC.
- **Vulnerabilities:** 5 API routes lack explicit auth checks. Redundant error catching risks leaking internal errors if `error.message` is returned to client directly.

## 7. Frontend Inventory
*Pending deep functional testing.* 
- `/events/[slug]/scanner`: Fixed React Hook stale closure bug causing linter errors.

## 8. Line-by-Line Findings Log

| # | File:Line | Severity | Category | Description | Status |
|---|-----------|----------|----------|--------------|--------|
| 1 | `app/(dashboard)/events/[slug]/scanner/page.tsx:25` | Low | Correctness | `onScanSuccess` and `onScanFailure` accessed before declaration. | Fixed |
| 2 | `app/api/admin/forms/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 3 | `app/api/admin/forms/[id]/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 4 | `app/api/applications/[id]/status/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 5 | `app/api/events/[id]/invite/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 6 | `app/api/events/[id]/sessions/[sessionId]/attendance/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 7 | `app/api/events/route.ts:86` | Medium | Correctness | `countResult` query breaks pagination. | Fixed |
| 8 | `app/api/achievements/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 9 | `app/api/achievements/scan/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 10 | `app/api/admin/audit/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 11 | `app/api/admin/members/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 12 | `app/api/admin/members/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 13 | `app/api/announcements/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 14 | `app/api/announcements/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 15 | `app/api/applications/export/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 16 | `app/api/applications/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 17 | `app/api/applications/[id]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 18 | `app/api/auth/[...all]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 19 | `app/api/certificates/blast/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 20 | `app/api/certificates/issue/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 21 | `app/api/certificates/issue-single/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 22 | `app/api/certificates/templates/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 23 | `app/api/certificates/templates/[id]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 24 | `app/api/certificates/[id]/revoke/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 25 | `app/api/compliance/delete/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 26 | `app/api/compliance/export/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 27 | `app/api/content/calendar/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 28 | `app/api/content/calendar/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 29 | `app/api/content/import/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 30 | `app/api/content/import/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 31 | `app/api/content/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 32 | `app/api/cron/github-stars/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 33 | `app/api/engagement/leaderboard/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 34 | `app/api/engagement/pending-approvals/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 35 | `app/api/engagement/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 36 | `app/api/events/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 37 | `app/api/events/[id]/approve/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 38 | `app/api/events/[id]/budget/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 39 | `app/api/events/[id]/certificates/issue-all/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 40 | `app/api/events/[id]/deregister/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 41 | `app/api/events/[id]/expenses/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 42 | `app/api/events/[id]/export/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 43 | `app/api/events/[id]/guest-register/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 44 | `app/api/events/[id]/guest-register/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 45 | `app/api/events/[id]/import/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 46 | `app/api/events/[id]/import/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 47 | `app/api/events/[id]/inventory/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 48 | `app/api/events/[id]/invite/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 49 | `app/api/events/[id]/invite-link/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 50 | `app/api/events/[id]/meetings/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 51 | `app/api/events/[id]/meetings/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 52 | `app/api/events/[id]/notify-colleagues/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 53 | `app/api/events/[id]/notify-colleagues/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 54 | `app/api/events/[id]/post-event/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 55 | `app/api/events/[id]/register/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 56 | `app/api/events/[id]/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 57 | `app/api/events/[id]/scan/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 58 | `app/api/events/[id]/sessions/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 59 | `app/api/events/[id]/walk-in/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 60 | `app/api/events/[id]/whatsapp-template/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 61 | `app/api/faculty/freeze/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 62 | `app/api/faculty/settings/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 63 | `app/api/finance/budgets/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 64 | `app/api/finance/expenses/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 65 | `app/api/finance/expenses/[id]/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 66 | `app/api/finance/incomes/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 67 | `app/api/health/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 68 | `app/api/interviews/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 69 | `app/api/inventory/log/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 70 | `app/api/inventory/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 71 | `app/api/members/directory/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 72 | `app/api/notifications/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 73 | `app/api/onboarding/apply/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 74 | `app/api/onboarding/approve/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 75 | `app/api/procurement/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 76 | `app/api/projects/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 77 | `app/api/projects/[id]/approve/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 78 | `app/api/projects/[id]/approve/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 79 | `app/api/projects/[id]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 80 | `app/api/research/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 81 | `app/api/research/[id]/approve/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 82 | `app/api/research/[id]/approve/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 83 | `app/api/scanner/batch/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 84 | `app/api/scanner/check-in/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 85 | `app/api/sessions/[id]/check-in/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 86 | `app/api/sessions/[id]/scan/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 87 | `app/api/setup/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 88 | `app/api/upload/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 89 | `app/api/users/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 90 | `app/api/users/[id]/role/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 91 | `app/api/vendors/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 92 | `app/api/vendors/[id]/rate/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |

## 9. Remediation Plan

### Fix Pagination Count Logic
- **Scope:** Small
- **Proposed Fix:** Extract the Drizzle conditions array into a reusable block and apply it to both the main `select()` query and the `count()` query in `app/api/events/route.ts`. **[COMPLETED]**

### Standardize API Wrapper Usage (Remove Redundant Try/Catch)
- **Scope:** Large (touches 45 files)
- **Proposed Fix:** Create a script or systematically go through all 45 API routes identified. Remove the inner `try { ... } catch (error) { return NextResponse.json(...) }` blocks if the route is wrapped in `withApiHandler`. Allow `ValidationError` and `AuthorizationError` to bubble up.
- **Why:** Ensures consistent rate limiting, error logging via Pino/Sentry, and consistent error payload shapes (`{ error, details }`).

### Audit "Missing Auth" Routes
- **Scope:** Small
- **Proposed Fix:** Inspect the 5 identified routes: `app/api/content/calendar/route.ts`, `app/api/engagement/leaderboard/route.ts`, `app/api/engagement/route.ts`, `app/api/events/[id]/guest-register/route.ts`, `app/api/health/route.ts`. Add `requireSession()` if they are private, or document them as explicitly public.


### N+1 Query Patterns
- **Scope:** Large (12 API routes)
- **Problem:** Database queries (e.g. db.select, db.insert) are running inside or...of loops or .map() arrays in 12 API routes (e.g., bulk event imports, calendar syncs, notify-colleagues). This is a classic N+1 performance bottleneck that will degrade under load.
- **Proposed Fix:** Refactor these loops to use inArray queries or batch insert().values(arr) for Drizzle, drastically reducing DB roundtrips.
- **Estimated Scope:** Medium
- **Suggested Order:** Address after Standardizing API Wrapper Usage.

## 10. What Was Actually Changed This Session
- Initialized `AUDIT.md`.
- Created custom `scripts/audit-routes.ts` to statically analyze all 81 API routes for missing wrappers, redundant try/catches, and missing auth.
- Fixed React Hook ordering bug in `/events/[slug]/scanner/page.tsx` causing ESLint failure.
- Fixed missing `withApiHandler` wrappers on:
  - `app/api/admin/forms/route.ts`
  - `app/api/admin/forms/[id]/route.ts`
  - `app/api/applications/[id]/status/route.ts`
  - `app/api/events/[id]/invite/route.ts`
  - `app/api/events/[id]/sessions/[sessionId]/attendance/route.ts`
- Fixed the pagination count bug in `app/api/events/route.ts` where it was computing `count(*)` over the entire table instead of applying the dynamic filters.
- Ran strict TypeScript verification (`tsc --noEmit`) and ESLint over the entire project, confirming 0 compile errors and 0 lint errors remaining.

## 11. Open Questions / Needs Human Input
- Are `app/api/engagement/leaderboard/route.ts`, `app/api/engagement/route.ts`, and `app/api/content/calendar/route.ts` intended to be fully public unauthenticated endpoints?
