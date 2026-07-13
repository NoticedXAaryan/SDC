# SDC OS — Master Remediation & Implementation Plan

> **Audit Date:** 2026-07-13  
> **Auditor Persona:** Industry Software Auditor  
> **Scope:** Full codebase scan focusing on Applicant Lifecycle, Event Management, Project & Admin Tools, and Deployment & Quality.
> **Verdict:** The architecture is solid but contains significant "AI slop" — mock interfaces, missing logic, and unlinked decorative features.

This document provides a highly prescriptive, step-by-step plan. An AI agent can read this document with the instruction to "fix this" and implement every step to produce a robust, production-ready system.

---

## 1. Applicant Lifecycle Management

**Objective:** Handle the full cycle from application to selection, manage role allotments, revamp registration to mimic Google Forms, and ensure all data is downloadable/updatable.

### 1.1 Revamp Registration to Google Forms Style
Currently, `app/recruitment/apply/page.tsx` uses a static 4-step form.
- **Task 1: Schema Updates.** 
  - Create a new `form_templates` table in `lib/db/schema.ts` to store dynamic form fields (e.g., `id`, `cycleName`, `fields: jsonb` where fields contain `{ type: 'text'|'radio'|'file', question: string, options?: string[], required: boolean }`).
  - Update the `applications` table to ensure `answers: jsonb` can map exactly to the `fields` defined in `form_templates`.
- **Task 2: Form Builder UI (Admin).**
  - Create `app/(dashboard)/admin/forms/page.tsx`. Implement a drag-and-drop form builder using `@dnd-kit/core` or `react-hook-form` dynamic fields to let admins create custom questions for specific application cycles.
- **Task 3: Dynamic Applicant UI.**
  - Rewrite `app/recruitment/apply/page.tsx` to fetch the active `form_templates` record and render the fields dynamically using `react-hook-form`.
  
### 1.2 Full Application Cycle Management & Role Allotment
- **Task 1: Fix Application Submission Flow.** 
  - Add `"draft"` to the `applicationStatusEnum` in `schema.ts`. Currently, "Next" clicks save as `"applied"`, improperly triggering AI grading.
  - In `app/api/applications/route.ts`, only dispatch the BullMQ grading job if the final submission changes status to `"applied"`.
- **Task 2: Role Allotment on Acceptance.**
  - In the application review UI (`app/api/applications/[id]/status/route.ts`), when an application's status is changed to `"accepted"`, automatically update the corresponding user's `role` to `"member"` in the `user` table.
  - Allocate domains/positions based on a new dropdown in the acceptance modal.
- **Task 3: Export and Update Functionality.**
  - Create `app/api/applications/export/route.ts`. Use `papaparse` to fetch all applications for a cycle, flatten the `jsonb` answers, and return a downloadable `.csv` file.
  - Add a "Download CSV" button to `app/(dashboard)/recruitment/page.tsx`.

---

## 2. Event Management

**Objective:** Manage small/large events, configurations, invitations, cancellations, operations, and certificates.

### 2.1 Full Lifecycle & Event Operations
- **Task 1: Event Publishing and Cancellation.**
  - In `app/(dashboard)/events/[slug]/page.tsx`, add a "Publish Event" button that updates status from `"draft"` to `"published"`. 
  - Add a "Cancel Event" button that updates status to `"cancelled"` and triggers an email to all registered users via `resend`.
- **Task 2: Sessions and Operations UI.**
  - The schema has `eventSessions` and `sessionAttendance` but no UI. Create `app/(dashboard)/events/[slug]/sessions/page.tsx`.
  - Allow organizers to add time-boxed sessions (e.g., "Keynote", "Workshop A").
  - Create a QR check-in scanner specifically for sessions: `app/(dashboard)/events/[slug]/sessions/[sessionId]/scan/page.tsx`.
- **Task 3: Event Invitations.**
  - Create an invitations UI inside the event dashboard. Allow admins to input a list of emails.
  - Create `app/api/events/[slug]/invite/route.ts` to generate unique registration links and send them via `resend`. 

### 2.2 Certificate Making Feature
- **Task 1: Fix Certificate Preview and Storage.**
  - `app/(dashboard)/lead/certificates/page.tsx` currently uses an `<iframe>` with a local `basePdf` path, which is broken in production.
  - Change local storage in `lib/services/storage.ts` to use Amazon S3 (via `@aws-sdk/client-s3`) or Cloudflare R2 for scalable, persistent certificate storage.
  - Use `pdf-lib` to render thumbnail images of certificates server-side instead of relying on client-side iframes.

---

## 3. Project and Administrative Tools

**Objective:** Manage project ideas, notes, archives, and meeting logs for a complete operational trail.

### 3.1 Project Ideas & Notes Workflow
- **Task 1: Project Ideas Schema.**
  - Add a `project_ideas` table to `schema.ts` with fields: `title`, `description`, `proposedBy`, `status` (idea, approved, rejected), and `notes: jsonb` (to store comment trails).
- **Task 2: Kanban/List UI for Ideas.**
  - Create `app/(dashboard)/projects/ideas/page.tsx` to list proposed ideas. 
  - Implement a sliding drawer or modal to add notes, discuss, and approve ideas into actual `projects`.

### 3.2 Archives & Meeting Logs
- **Task 1: Meeting Logs System.**
  - Create a `meeting_logs` table: `id`, `date`, `attendees (jsonb array of userIds)`, `agenda`, `minutes`, `actionItems`.
  - Build `app/(dashboard)/admin/meetings/page.tsx` for creating and viewing these logs. Ensure they are searchable to maintain a full management trail.
- **Task 2: Archival System.**
  - Add an `/archives` page. Any event whose `endsAt` date is in the past, or any application cycle marked as "closed", should be filtered out of the main dashboards and moved to the Archives view.

---

## 4. Deployment and Quality

**Objective:** Ensure a flawless release, fix critical bugs, and improve the application's overall quality and reliability.

### 4.1 Deployment Infrastructure Fixes
- **Task 1: Fix the `nanoid` Build Breaker.**
  - `nanoid` is imported in 10+ API routes but is entirely missing from `package.json`. This will cause the production build to crash. 
  - **Action:** Run `npm install nanoid` or replace all usages with `crypto.randomUUID()`.
- **Task 2: Docker Compose & Postgres.**
  - `docker-compose.yml` is missing a database. Add a `postgres:15-alpine` service so local development accurately mirrors production.
  - Update `Dockerfile.worker` (or use a multi-stage approach in `Dockerfile`) to properly pre-compile the background worker (`worker.ts`) rather than running `tsx` in production. Add healthcheck endpoints to ensure the worker is alive.

### 4.2 Quality & System-Wide Enhancements
- **Task 1: Replace Fake UI Stubs.**
  - The `hooks/use-toast.ts` hook is currently a mock that just `console.log`s. Replace it with `sonner` so users actually see success/error messages.
  - `app/(dashboard)/achievements/page.tsx` has buttons ("Submit Paper") with no `onClick` or `href`. Wire them to real forms that POST to `/api/research` and `/api/achievements`.
- **Task 2: Security & Authentication Polish.**
  - The registration form lacks validation. Enforce password strength via `zod` and integrate rate limiting on the `/api/auth/register` route.
  - Standardize error handling in all `/api/*` routes by using the `withApiHandler` wrapper.
- **Task 3: Drizzle Relations.**
  - The `schema.ts` file lacks comprehensive `relations()` definitions for Drizzle's relational query API. Add relations to ensure fast, type-safe joins (e.g., link `events` to `budgets` and `projects` to `users`).

---

## Recommended Tools & Libraries Checklist
- [x] **`@dnd-kit/core`** or **`react-hook-form`** (For Google Form style builder)
- [x] **`papaparse`** (For downloading application CSVs)
- [x] **`@aws-sdk/client-s3`** (For persistent certificate and attachment storage)
- [x] **`sonner`** (To replace the fake `useToast` UI glitch)
- [x] **`pdf-lib`** (For server-side PDF manipulation and previews)
