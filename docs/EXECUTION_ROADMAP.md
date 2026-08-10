# SDC — Execution Roadmap

> **Purpose:** This is a step-by-step task list for an AI agent (or human developer) to systematically test, fix, and complete every feature in the SDC platform. Each step has clear inputs, actions, and success criteria.
>
> **Read first:** `docs/SPECIFICATION.md` (what to build and in what order), `docs/ai/00-project-brief.md` (what this is), and `docs/ARCHITECTURE.md` (how everything works).

---

## How to use this document

1. Work **one step at a time**, top to bottom
2. **Don't skip ahead** — each step may depend on the previous one
3. For each step: read the success criteria, do the work, verify the criteria are met, then move on
4. If a step fails, fix it before continuing
5. Mark steps with `[x]` as you complete them

---

## Step 0: Environment Setup & Smoke Test

- `[ ]` **0.1** Verify `.env.local` has all required vars: `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `ADMIN_EMAIL`
- `[ ]` **0.2** Run `npm install` — no errors
- `[ ]` **0.3** Run `npm run db:migrate` — migrations apply cleanly
- `[ ]` **0.4** Run `npm run build` — zero TypeScript or build errors
- `[ ]` **0.5** Run `npm run dev` — app starts on http://localhost:3000
- `[ ]` **0.6** Run `npm run worker` (separate terminal) — workers start, no crash
- `[ ]` **0.7** Hit `GET /api/health` — returns 200
- `[ ]` **0.8** Hit `GET /api/ready` — returns 200
- `[ ]` **0.9** Run `npm test` — existing tests pass

**Success:** App boots, workers start, health checks pass, tests green.

---

## Step 1: Authentication — End-to-End

Test every auth flow and fix anything broken.

- `[ ]` **1.1** Visit `/register` — page renders with split-panel layout
- `[ ]` **1.2** Register a new account with email/password — verify email verification link is sent (check Resend dashboard or logs)
- `[ ]` **1.3** Click verify link — email marked verified, redirected to dashboard
- `[ ]` **1.4** Log out, visit `/login` — page renders
- `[ ]` **1.5** Log in with the created account — redirected to `/dashboard`
- `[ ]` **1.6** Visit `/forgot-password` — page renders, enter email, verify reset email is sent
- `[ ]` **1.7** Click reset link → `/reset-password` — enter new password, verify it works
- `[ ]` **1.8** Test Google OAuth (if `GOOGLE_CLIENT_ID` is set) — login and register work
- `[ ]` **1.9** Test proxy protection: unauthenticated visit to `/dashboard` redirects to `/login?callbackUrl=/dashboard`
- `[ ]` **1.10** Test proxy allows public paths: `/`, `/projects`, `/privacy`, `/terms` all load without redirect
- `[ ]` **1.11** Run `npm run db:set-owner` with the registered email — verify user role changes to "owner"
- `[ ]` **1.12** Verify the admin email auto-assignment: register with the `ADMIN_EMAIL` address — role should be "owner" automatically

**Success:** All auth flows work end-to-end. Proxy correctly protects and allows routes.

---

## Step 2: Landing Page & Public Pages

The landing page IS the club's public website. Make it match the space/cosmic design direction.

- `[ ]` **2.1** Review current landing page (`app/page.tsx`) — audit against design direction (space theme, Comet Browser gradients, blackhole logo)
- `[ ]` **2.2** Restyle landing page: dark cosmic background, celestial gradient accents, orbital motion effects
- `[ ]` **2.3** Verify all landing page links work: Login, Register, Events, Projects
- `[ ]` **2.4** Review `/privacy` page — renders correctly
- `[ ]` **2.5** Review `/terms` page — renders correctly
- `[ ]` **2.6** Test mobile responsiveness on landing page — layout collapses gracefully
- `[ ]` **2.7** Verify SEO: proper `<title>`, `<meta description>`, semantic HTML, single `<h1>`

**Success:** Landing page looks like a premium space-themed club website. All public pages render and link correctly.

---

## Step 3: Dashboard — All Roles

- `[ ]` **3.1** Login as **owner** — dashboard shows admin metrics (member count, pending approvals, events, etc.) from real DB data
- `[ ]` **3.2** Verify sidebar navigation renders all 4 sections correctly (Main, Management, Finance, Administration)
- `[ ]` **3.3** Test role switching (change a test user's role via `/api/users/:id/role`) and verify dashboard changes:
  - `[ ]` Admin sees admin dashboard
  - `[ ]` Lead sees lead dashboard
  - `[ ]` Member sees student dashboard
- `[ ]` **3.4** Verify breadcrumbs render on every dashboard sub-page
- `[ ]` **3.5** Verify mobile navigation works (hamburger menu / mobile nav)
- `[ ]` **3.6** Apply space theme styling to dashboard shell (dark sidebar, cosmic accents)

**Success:** Dashboard renders correctly for all roles with real data. Navigation is intuitive and role-gated.

---

## Step 4: Events — Full Lifecycle

Test the entire event lifecycle from creation to archive.

- `[ ]` **4.1** Create event at `/events/create` — fill all fields (title, type, description, dates, capacity, visibility)
- `[ ]` **4.2** Verify event saved with `status=draft`
- `[ ]` **4.3** Approve event at `/manage/approvals` — status changes to `published`
- `[ ]` **4.4** Verify published event appears on `/events` listing
- `[ ]` **4.5** Visit `/events/:slug` — public event page renders with all details
- `[ ]` **4.6** Register for event as a member — verify `confirmed` status and `passCode` generated
- `[ ]` **4.7** View pass at `/passes/:eventId` — QR code renders with passCode
- `[ ]` **4.8** Test capacity: register up to capacity, then verify next registration gets `waitlist` status
- `[ ]` **4.9** Test deregistration — `POST /api/events/:id/deregister` works
- `[ ]` **4.10** Add event sessions — verify they appear on event page
- `[ ]` **4.11** Export registrations as CSV — verify CSV downloads with correct data
- `[ ]` **4.12** Test event editing at `/events/:slug/edit`
- `[ ]` **4.13** Test event duplication — `POST /api/events/:id/duplicate`
- `[ ]` **4.14** Archive event — `POST /api/events/:id/archive`, verify it moves to `/archive`

**Success:** Complete event lifecycle works: create → approve → register → attend → archive.

---

## Step 5: QR Scanner & Check-In

- `[ ]` **5.1** Visit `/scanner` — camera permission prompt appears, scanner UI loads
- `[ ]` **5.2** Scan a valid QR code (use the passCode from Step 4.7) — check-in succeeds
- `[ ]` **5.3** Scan same code again — "already checked in" message
- `[ ]` **5.4** Scan invalid code — error message
- `[ ]` **5.5** Test batch check-in: `POST /api/scanner/batch` with multiple codes
- `[ ]` **5.6** Test event-specific scanner at `/events/:slug/scanner`
- `[ ]` **5.7** Verify session attendance tracking works for multi-session events

**Success:** Scanner reads QR codes, checks in attendees, handles duplicates and errors.

---

## Step 6: Certificates

- `[ ]` **6.1** Create certificate template at `/lead/certificates` — design with pdfme editor
- `[ ]` **6.2** Verify template saved via `GET /api/certificates/templates`
- `[ ]` **6.3** Link template to an event
- `[ ]` **6.4** Issue certificates for all checked-in attendees: `POST /api/events/:id/certificates/issue-all`
- `[ ]` **6.5** Verify BullMQ certificate worker processes the job (check worker logs)
- `[ ]` **6.6** Verify certificates appear in user's `/certificates` page
- `[ ]` **6.7** Test public verification at `/verify/:code` — shows certificate details
- `[ ]` **6.8** Test revocation: `POST /api/certificates/:id/revoke` — verify status changes and verify page shows revoked
- `[ ]` **6.9** Test template editing at `/lead/certificates/templates/:id/edit`

**Success:** Full certificate lifecycle: design template → issue → download → verify → revoke.

---

## Step 7: Recruitment Pipeline

- `[ ]` **7.1** Create recruitment form template (run `scripts/init-form-template.ts` or create via API)
- `[ ]` **7.2** Visit `/recruitment/apply` — form renders with all fields
- `[ ]` **7.3** Submit application — verify saved with `status=applied`
- `[ ]` **7.4** If `OPENAI_API_KEY` is set: verify grading worker scores the application
- `[ ]` **7.5** Review applications at `/manage/recruitment` — list renders with real data
- `[ ]` **7.6** Accept an application — verify user role changes to "member"
- `[ ]` **7.7** Reject an application — verify AI-generated rejection message (`POST /api/ai/generate-rejection`)
- `[ ]` **7.8** Schedule interview — verify interview record created
- `[ ]` **7.9** View interviews at `/recruitment/interviews`
- `[ ]` **7.10** Export applications as CSV

**Success:** Full recruitment pipeline: apply → grade → review → accept/reject/interview.

---

## Step 8: Finance & Procurement

- `[ ]` **8.1** Create budget at `/finance/budget` — linked to an event
- `[ ]` **8.2** Submit expense at `/finance/expenses` — verify `status=pending`
- `[ ]` **8.3** Approve expense as admin — status changes, amount tracked
- `[ ]` **8.4** Reject expense — verify status changes
- `[ ]` **8.5** View finance dashboard — allocated vs. spent vs. remaining
- `[ ]` **8.6** Create procurement request at `/finance/procurement`
- `[ ]` **8.7** Add vendor at `/api/vendors`
- `[ ]` **8.8** Rate vendor — `POST /api/vendors/:id/rate`
- `[ ]` **8.9** Complete procurement lifecycle: draft → quotes → approval → completed
- `[ ]` **8.10** Track income: `POST /api/finance/incomes`

**Success:** Finance and procurement workflows are fully functional.

---

## Step 9: Forms Builder

- `[ ]` **9.1** Create form at `/manage/forms` — add various field types (text, email, dropdown, file, etc.)
- `[ ]` **9.2** Publish form
- `[ ]` **9.3** Fill out form as a member at `/forms/:id`
- `[ ]` **9.4** View responses at `/manage/forms/:id/edit`
- `[ ]` **9.5** Close form — verify no more submissions accepted
- `[ ]` **9.6** Test form settings: `allowExternal`, `requireLogin`, `quotaPerUser`

**Success:** Dynamic forms can be created, published, filled, and responses viewed.

---

## Step 10: Inventory

- `[ ]` **10.1** Add inventory items at `/inventory`
- `[ ]` **10.2** Check out items — verify `qtyAvailable` decreases
- `[ ]` **10.3** Check in items — verify `qtyAvailable` increases
- `[ ]` **10.4** View inventory logs — audit trail shows who checked what when
- `[ ]` **10.5** Verify low-stock alerts appear on admin dashboard

**Success:** Inventory CRUD and check-in/check-out tracking works.

---

## Step 11: Projects & Achievements

- `[ ]` **11.1** Submit project at `/projects/submit` — with team members and images
- `[ ]` **11.2** Approve project — verify it appears on public `/projects` page
- `[ ]` **11.3** View project detail at `/projects/:id`
- `[ ]` **11.4** Submit achievement at `/achievements` — with proof
- `[ ]` **11.5** Approve achievement — verify points awarded
- `[ ]` **11.6** Check leaderboard at `/leaderboard` — points reflected

**Success:** Projects showcase and gamification/achievements work.

---

## Step 12: Communications & Notifications

- `[ ]` **12.1** Send event communication at `/communications` — target all registrants
- `[ ]` **12.2** Verify emails sent via email worker (check logs)
- `[ ]` **12.3** Create announcement at `/api/announcements`
- `[ ]` **12.4** Verify notifications appear in user's `/notifications` page
- `[ ]` **12.5** Mark notification as read
- `[ ]` **12.6** Test content pipeline at `/lead/content` — create content item, set scheduled date

**Success:** Email communications send, notifications appear, content pipeline tracks items.

---

## Step 13: Settings & Compliance

- `[ ]` **13.1** Visit `/settings` — user settings page renders
- `[ ]` **13.2** Update username — verify uniqueness check works
- `[ ]` **13.3** Visit `/settings/compliance` — GDPR page renders
- `[ ]` **13.4** Export personal data — `GET /api/compliance/export` returns user's data
- `[ ]` **13.5** Test faculty freeze toggle — `POST /api/faculty/freeze` freezes operations
- `[ ]` **13.6** Visit `/manage/settings` — admin settings render

**Success:** User settings, GDPR compliance, and admin settings all work.

---

## Step 14: Admin & Audit

- `[ ]` **14.1** Visit `/admin/ai-logs` — AI usage logs render (if any)
- `[ ]` **14.2** View audit log at admin dashboard — shows recent actions
- `[ ]` **14.3** Test member management: change roles, ban/unban users
- `[ ]` **14.4** Verify audit trail: every action from Steps 1-13 has an audit log entry

**Success:** Admin tools and audit trail are comprehensive and functional.

---

## Step 15: Visual Polish — Space Theme

Apply the design direction across the entire application.

- `[ ]` **15.1** Restyle landing page (`app/page.tsx`) — space/cosmic theme with Comet Browser gradients
- `[ ]` **15.2** Update `globals.css` — define space color palette (deep blacks, cosmic purples, nebula accents)
- `[ ]` **15.3** Update auth pages (login, register, forgot-password, reset-password) — cosmic left panel
- `[ ]` **15.4** Update dashboard shell — dark sidebar with cosmic accent
- `[ ]` **15.5** Style public event pages — space-themed cards and layouts
- `[ ]` **15.6** Style public projects page — cosmic showcase
- `[ ]` **15.7** Style certificate verification page — premium space feel
- `[ ]` **15.8** Add micro-animations: orbital loading spinners, gravitational hover effects
- `[ ]` **15.9** Verify dark mode is consistent across all pages
- `[ ]` **15.10** Test mobile responsiveness with new theme on all pages

**Success:** The entire app feels like a cohesive space-themed premium platform.

---

## Step 16: Docker & Deployment

- `[ ]` **16.1** Run `docker-compose up --build` — all services start
- `[ ]` **16.2** Verify web app accessible at http://localhost:3000
- `[ ]` **16.3** Verify worker processes jobs
- `[ ]` **16.4** Verify health check: `GET /api/health` returns 200
- `[ ]` **16.5** Run through a quick smoke test: register, login, create event, scan QR
- `[ ]` **16.6** Verify `output: "standalone"` produces a correct build for Dokploy

**Success:** Docker deployment works end-to-end.

---

## Step 17: Final Audit

- `[ ]` **17.1** Run `npm run build` — zero errors
- `[ ]` **17.2** Run `npm run lint` — zero errors (or only warnings)
- `[ ]` **17.3** Run `npm test` — all tests pass
- `[ ]` **17.4** Grep for `TODO`, `FIXME`, `HACK` — document or resolve each
- `[ ]` **17.5** Grep for hardcoded URLs, fake data, mock values — remove all
- `[ ]` **17.6** Verify no secrets in source (`.env` in `.gitignore`, no keys in code)
- `[ ]` **17.7** Review `docs/ARCHITECTURE.md` — update if any features changed during Steps 1-16
- `[ ]` **17.8** Create a clean git commit with conventional commit message

**Success:** Codebase is clean, documented, tested, and ready for deployment.
