# SDC OS — Comprehensive Codebase Audit & Remediation Plan

> **Audit Date:** 2026-07-13  
> **Auditor Persona:** Industry Software Auditor  
> **Scope:** Full codebase scan — every file, route, API, component, service, worker, schema, and configuration  
> **Verdict:** The codebase has a solid architectural skeleton with good ideas (RBAC, BullMQ queues, HMAC passes, audit logging, AI grading) but **~40% of the surface area is incomplete, non-functional, or stub-quality**. It would fail any production readiness review. Below is the complete findings and remediation plan.

---

## Table of Contents

1. [Critical Bugs & Broken Functionality](#1-critical-bugs--broken-functionality)
2. [Registration & Applicant Lifecycle Issues](#2-registration--applicant-lifecycle-issues)
3. [Event Management Issues](#3-event-management-issues)
4. [Project & Administrative Tools Issues](#4-project--administrative-tools-issues)
5. [Certificate System Issues](#5-certificate-system-issues)
6. [Finance & Budget Issues](#6-finance--budget-issues)
7. [Notification System Issues](#7-notification-system-issues)
8. [Authentication & Security Issues](#8-authentication--security-issues)
9. [Deployment & Infrastructure Issues](#9-deployment--infrastructure-issues)
10. [Missing Features to Add](#10-missing-features-to-add)
11. [Code Quality & Technical Debt](#11-code-quality--technical-debt)
12. [Recommended Libraries & Tools](#12-recommended-libraries--tools)
13. [Prioritized Task Checklist](#13-prioritized-task-checklist)

---

## 1. Critical Bugs & Broken Functionality

### 1.1 `nanoid` — Missing Dependency (BUILD BREAKER)

> [!CAUTION]
> **10+ files import `nanoid` but it is NOT listed in `package.json`.** This will cause a runtime crash on any fresh `npm install` or CI/CD build.

**Files affected:**
- `lib/services/tasks.ts`
- `app/api/applications/route.ts`
- `app/api/vendors/route.ts`
- `app/api/procurement/route.ts`
- `app/api/events/[id]/walk-in/route.ts`
- `app/api/events/[id]/sessions/route.ts`
- `app/api/events/[id]/import/route.ts`
- `app/api/content/route.ts`
- `app/api/achievements/route.ts`

**Fix:** Run `npm install nanoid` or replace all usages with `crypto.randomUUID()` (already available via Node.js built-in).

---

### 1.2 Application Form Submits Without Real Validation

**Issue:** The apply page at `app/recruitment/apply/page.tsx` has a multi-step form, but the API route at `app/api/applications/route.ts` **skips validation entirely for drafts** (`body.status !== "draft"` guard) and the schema has `status: "draft"` as valid, but the database enum `application_status` has no `"draft"` value. The code falls back to `"applied"` always, meaning:

1. **Any click on "Next" in the form fires a POST to `/api/applications` with `status: "draft"` → which gets overridden to `"applied"`.** The user's application is immediately submitted in `applied` state before they finish filling it out.
2. **The grading job gets dispatched on every "Next" click** because `data.status` is `"draft"` but the saved status is `"applied"`, and the condition checks `data.status !== "draft"` on the original body (which IS `"draft"`), so grading is skipped — but the application is already marked `"applied"`.
3. When the user actually submits on the final step, it updates the same record to `"applied"` again (an effective no-op) and fires the grading job.

**Fix:**
1. Add `"draft"` to the `applicationStatusEnum`: `["draft", "applied", "ai_graded", ...]`
2. Generate and run a new migration: `npx drizzle-kit generate` then `npm run db:migrate`
3. Remove the fallback override in the API route.
4. Only dispatch grading when the final status is `"applied"`, not `"draft"`
5. Consider removing the auto-save POST on "Next" — use `localStorage` only for drafts, and POST only on final submit

---

### 1.3 Event Visibility Mismatch

**Issue:** The create event form at `app/(dashboard)/events/create/page.tsx` offers visibility options `"public"`, `"members_only"`, `"invite_only"`, but the database enum `eventVisibilityEnum` at `lib/db/schema.ts` only has `["public", "private", "unlisted"]`. The Zod validator at `lib/validators/event.ts` also only allows `["public", "private", "unlisted"]`.

**Result:** Submitting with `members_only` or `invite_only` will **fail Zod validation** silently, returning a 400 error with no clear explanation to the user.

**Fix:** Align the form options with the enum. Either update the DB enum and Zod schema to support `members_only` and `invite_only`, or change the form to show `Public`, `Private`, `Unlisted`.

---

### 1.4 `$onUpdateFn` Does Not Work with Drizzle ORM Select Queries

**Issue:** Multiple columns in `schema.ts` use `$onUpdateFn(() => new Date())`. In Drizzle ORM, `$onUpdateFn` only triggers on `.update()` calls via Drizzle, **not** on database-level updates. If any update happens via raw SQL, direct Postgres, or another ORM, the `updatedAt` field will remain `null`. Several of these columns also lack a `.defaultNow()` — meaning on first insert, `updatedAt` is `null`.

**Fix:** Add `.defaultNow()` to every `updatedAt` column that uses `$onUpdateFn`, and also set `updatedAt: new Date()` explicitly in every `.update()` call as a defense-in-depth measure.

---

### 1.5 Dead Pages, Broken Links, and Orphaned Routes

**Issue:** The codebase contains numerous links to non-existent pages and orphaned routes that are not connected to the main layout.
- The `nav.ts` config links to `/scanner`, which maps to `app/(dashboard)/scanner/page.tsx`. However, there is also an orphaned `app/dashboard/scanner/page.tsx` (not in the `(dashboard)` group) that may be conflicting or dead code.
- `app/dashboard/roles/page.tsx` and `app/dashboard/faculty/page.tsx` exist but are not linked anywhere in the UI.
- The roles page calls `/api/users` which doesn't seem to have a complete implementation for listing all users in a secure way.
- The "Edit Design" button in `app/(dashboard)/lead/certificates/page.tsx` links to `/lead/certificates/templates/${template.id}/edit` which doesn't exist.
- Navigation links in sidebar point to `/admin/members` and `/admin/audit`, but it's unclear if these routes are fully implemented or just return stubs.

**Fix:** 
1. Consolidate `app/dashboard/*` into `app/(dashboard)/*` to use the shared layout.
2. Ensure all routes defined in `nav.ts` actually exist.
3. Remove dead code or implement the missing pages.

---

### 1.6 Fake `useToast` Hook (UI Glitch)

**Issue:** The `hooks/use-toast.ts` file is a fake stub that only contains `console.log("Toast:", props);` instead of rendering a real toast notification to the screen. This means actions like role changes, form submissions, and errors fail silently for the user.

**Fix:** Implement a real toast notification system using `sonner` or `shadcn/ui` toast component.

---

### 1.7 Achievements "Submit Paper" and "Report Win" Buttons Do Nothing

**Issue:** `app/(dashboard)/achievements/page.tsx` has two buttons: "Submit Paper" and "Report Win". These buttons have **no `onClick` handler and no `href`**. They are purely decorative.

**Fix:** Wire these to modal dialogs or separate pages that POST to `/api/achievements` and `/api/research` respectively.

---

### 1.8 Finance & Inventory Pages — Read-Only Stubs

**Issue:** 
- `app/(dashboard)/finance/budget/page.tsx` displays the text `"Detailed view pending implementation."` in the UI.
- `app/(dashboard)/inventory/page.tsx` only displays inventory items as cards. There is no way to add new items, check out/in items, or view logs.

**Fix:** Build out the full CRUD views for finance (expenses per budget, income per event, approval flows) and inventory (add item, check in/out).

---

## 2. Registration & Applicant Lifecycle Issues

### 2.1 Registration Form is Not Like a Google Form (Core Requirement)

**Current State:** The `app/recruitment/apply/page.tsx` has a fixed 4-step form with hardcoded fields. This does NOT meet the requirement for "functioning like a Google Form, allowing for multiple custom questions and answers."

**What's Missing:**
- No admin UI to create/edit custom form questions
- No dynamic form rendering from stored question definitions
- No support for different question types (multiple choice, checkboxes, short answer, file upload)
- No way to create different forms for different application cycles

**Fix — Approach:**
1. Create a `form_templates` table in the schema to store JSONB arrays of field definitions.
2. Build a Form Builder UI for admins (using `@dnd-kit/core` or similar).
3. Build a Dynamic Form Renderer for applicants that reads the JSONB template.
4. Store answers in the existing `applications.answers` JSONB column.

### 2.2 No Application Data Download

**Issue:** The requirement states "All registration data must be downloadable and updatable." There is no export/download feature for applications.

**Fix:**
- Add a "Download CSV" button on the applications page.
- Create an API route `GET /api/applications/export` that returns CSV (use `papaparse.unparse()`).

### 2.3 Application Board Missing Key Features

**Issues with `applications-board.tsx`:**
1. **"Simulate AI Grade" button** — misleading name. It changes status but does NOT trigger AI grading. The real grading happens via BullMQ on submit.
2. **No "needs_manual_review" column** — exists in enum but not in UI.
3. **No way to view full application details** — clicking a card does nothing.
4. **No search/filter** or **bulk actions**.

**Fix:** Add detail modals, search/filter, and rename the AI grade button to actually trigger a background job.

### 2.4 No Role Allotment After Acceptance

**Issue:** When an application is accepted, nothing happens. The applicant's `user.role` is never changed from `"applicant"` to `"member"`.

**Fix:** On acceptance, update `user.role` to `"member"`, assign a domain based on preference, and send an email notification.

### 2.5 Interview Scheduling Has No Create UI

**Issue:** `app/(dashboard)/recruitment/interviews/page.tsx` displays interviews but there's no way to create/schedule a new interview.

**Fix:** Add a "Schedule Interview" dialog that selects an applicant, sets date/time, and emails meeting details.

---

## 3. Event Management Issues

### 3.1 No Event Cancellation or Publishing UI

**Issue:** Events are created as `"draft"`. The API supports changing status and soft deletes, but there is no "Publish Event" or "Cancel Event" button in the UI.

**Fix:** Add prominent buttons on draft event pages to PATCH status to `"published"`, and a "Cancel Event" button with a confirmation dialog.

### 3.2 Event Edit Page — No Link from Event Detail

**Issue:** The edit page exists at `/events/[slug]/edit` but is unreachable from the event detail UI.

**Fix:** Add an "Edit Event" link in the admin controls section.

### 3.3 No Event De-registration for Attendees

**Issue:** Users can register for events but cannot unregister. The API route exists but there is no UI button for it.

**Fix:** Add an "Unregister" button on the event detail page.

### 3.4 Event Sessions — No UI at All

**Issue:** The schema has `eventSessions` and `sessionAttendance` tables, and API routes exist, but there is **zero UI** for creating, viewing, or checking into sessions.

**Fix:** Build a sessions management section within event detail pages with a "Add Session" form and session-level QR check-in.

### 3.5 No Event Invitation System

**Issue:** The requirement asks for "event invitations." There is an invite-link API but no UI to generate, share, or email invitations.

**Fix:** Add a "Generate Invite Link" button and a "Send Invitations" email feature.

### 3.6 No Meeting Logs or Operations Log

**Issue:** The requirement asks for "meeting logs". There is no such feature.

**Fix:** Create a `meetingLogs` table and build a UI section for creating meeting summaries (date, attendees, agenda, notes).

---

## 4. Project & Administrative Tools Issues

### 4.1 Projects Page — No Create/Submit UI

**Issue:** `app/projects/page.tsx` displays projects but there is no way for members to submit a project.

**Fix:** Add a "Submit Project" button/page with a form for title, description, URLs, and team members.

### 4.2 No Project Ideas / Notes System

**Issue:** The requirement asks for "Create project ideas and add notes." The `projects` table only tracks finished projects.

**Fix:** Add a `project_ideas` table with status workflow and build a Kanban or list UI with commenting/notes.

### 4.3 No Archives System

**Issue:** The requirement asks for "Create archives." There is no archive mechanism for old events or applications.

**Fix:** Add an `/archives` page that shows past events and historical data, and filter archived items out of main views.

---

## 5. Certificate System Issues

### 5.1 Certificate Template Preview Uses iframe with basePdf URL

**Issue:** `app/(dashboard)/lead/certificates/page.tsx` uses an `<iframe>` to preview the PDF. If `basePdf` is a local file path, this will be blocked or fail to render.

**Fix:** Generate thumbnail previews server-side instead of using iframes.

### 5.2 Storage Service is Local-Only

**Issue:** `lib/services/storage.ts` writes files to `public/uploads/` on the local filesystem. This is not scalable, files are lost on restart, and it's a security risk.

**Fix:** Implement cloud storage (Cloudflare R2, AWS S3, or Supabase Storage) using `@aws-sdk/client-s3`.

---

## 6. Finance & Budget Issues

### 6.1 No Expense/Income Management UI

**Issue:** The `expenses` and `incomes` tables exist with API support, but there is no UI to create, view, or approve them.

**Fix:** Build complete expense/income management forms and lists on the finance page.

---

## 7. Notification System Issues

### 7.1 No Notification UI

**Issue:** The API at `/api/notifications` works, but there is **no UI element** (no bell icon, no dropdown, no page) to show notifications.

**Fix:** Add a notification bell icon with unread count badge in the dashboard header, and a full `/notifications` page.

### 7.2 Notifications Not Triggered Consistently

**Issue:** Most state changes (application status change, event cancellation) don't create notifications.

**Fix:** Add notification dispatch calls in all critical state-change flows.

---

## 8. Authentication & Security Issues

### 8.1 Register Form — Too Simple

**Issue:** `components/auth/register-form.tsx` only asks for name, email, and password with no validation.

**Fix:** Add password strength requirements, CAPTCHA/rate limiting, and terms acceptance.

### 8.2 Role Dropdown Missing Many Roles

**Issue:** The `ROLES` dropdown in `member-table.tsx` only has 7 roles, while `auth.ts` defines 15 roles.

**Fix:** Use the full `SDC_ROLES` array.

### 8.3 Session Impersonation — No Audit Trail

**Issue:** Admin impersonation actions are not logged to the audit trail.

**Fix:** Add audit logging when an admin starts/ends impersonation.

### 8.4 PASS_SECRET Hardcoded Default

**Issue:** `lib/passes/qr.ts` has a hardcoded fallback secret.

**Fix:** Remove the default. Make `PASS_SECRET` required in `.env`.

### 8.5 API Routes Have Inconsistent Auth Patterns

**Issue:** Some routes use `requireSession()`, some `auth.api.getSession()`, some `getCurrentUser()`.

**Fix:** Standardize to use `withApiHandler` wrapper + `requireRole()` pattern.

---

## 9. Deployment & Infrastructure Issues

### 9.1 Dockerfile Uses `standalone` Output but No Worker Process

**Issue:** The Dockerfile builds a standalone app, but `docker-compose.yml` runs the worker via `npx tsx worker.ts` from the builder stage. No healthchecks exist.

**Fix:** Create a multi-stage build that pre-compiles the worker, and add Docker healthcheck endpoints.

### 9.2 No Database in Docker Compose

**Issue:** `docker-compose.yml` has Redis but no Postgres.

**Fix:** Add a Postgres service for local development.

### 9.3 No CI/CD Pipeline

**Issue:** No GitHub Actions workflow exists for linting, testing, or building.

**Fix:** Create `.github/workflows/ci.yml`.

---

## 10. Missing Features to Add

### 10.1 Mobile Navigation (Critical UX)
**Fix:** Add a mobile-responsive sheet/drawer navigation.

### 10.2 Dark Mode Toggle
**Fix:** Add a theme toggle button in the header.

### 10.3 Dashboard — No Application Status Widget
**Fix:** Add a card on the applicant dashboard showing their current application status and next steps.

### 10.4 No Data Export (GDPR/DPDP Compliance)
**Fix:** Build a compliance section in settings for "Download My Data" and "Delete My Account".

---

## 11. Code Quality & Technical Debt

### 11.1 Inconsistent Error Handling
**Fix:** Use `withApiHandler` universally and let errors bubble up.

### 11.2 Smoke Tests Are Trivial
**Fix:** Write actual tests for Auth DAL, Zod validators, and API routes.

### 11.3 No Relational Schema Definitions for `db.query`
**Fix:** Add Drizzle `relations()` definitions for all tables to properly support the relational query API.

### 11.4 `face-api.js` Dependency
**Issue:** A 14MB unmaintained ML library is installed but barely used.
**Fix:** Fully implement face recognition or remove the dependency.

---

## 12. Recommended Libraries & Tools

| Feature | Recommended Library | Why |
|---------|-------------------|-----|
| Form Builder (admin) | **`@dnd-kit/core`** + custom | Drag-and-drop form field ordering |
| Dynamic Form Renderer | **`react-hook-form`** | Already installed, needs dynamic rendering |
| Real-time Notifications | **Server-Sent Events** | Built-in, simpler than WebSockets |
| UI Components | **`sonner`** | Replace the fake `useToast` stub |
| Cloud Storage | **`@aws-sdk/client-s3`** | Works with Cloudflare R2 |
| Email Templates | **`@react-email/components`** | Migrate from inline HTML strings |

---

## 13. Prioritized Task Checklist

### Phase 1: Fix What's Broken (Week 1)
- [ ] **P0:** Install `nanoid` or replace with `crypto.randomUUID()` everywhere
- [ ] **P0:** Add `"draft"` to `applicationStatusEnum` + migration
- [ ] **P0:** Fix visibility enum mismatch (form vs DB vs Zod)
- [ ] **P0:** Remove dead/duplicate pages (`app/dashboard/*` vs `app/(dashboard)/*`)
- [ ] **P0:** Replace fake `useToast` hook with real toast implementation (`sonner`)
- [ ] **P0:** Add mobile navigation (hamburger/sheet menu)
- [ ] **P1:** Add "Publish Event" / "Cancel Event" / "Edit Event" buttons
- [ ] **P1:** Fix member-table role dropdown to include all 15 roles
- [ ] **P1:** Remove hardcoded default for `PASS_SECRET`

### Phase 2: Core Feature Completions (Weeks 2-3)
- [ ] Build dynamic form builder and renderer for recruitment
- [ ] Add application data CSV export
- [ ] Build interview scheduling UI
- [ ] Build event sessions management UI
- [ ] Build full finance/expense and inventory management UIs
- [ ] Build project submission form + approval flow
- [ ] Add "Application Status" widget to applicant dashboard

### Phase 3: New Features & Polish (Weeks 3-4)
- [ ] Build project ideas board with notes/comments
- [ ] Build meeting logs feature and archives page
- [ ] Implement cloud storage (R2/S3) for certificates
- [ ] Build GDPR compliance section (data export + account deletion)
- [ ] Add notification UI and dispatch calls

### Phase 4: Production Hardening (Week 4+)
- [ ] Write real unit and integration tests
- [ ] Create separate worker Dockerfile with pre-compiled code
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Add Drizzle `relations()` definitions to schema

---
<!-- GOAL_COMPLETE -->
