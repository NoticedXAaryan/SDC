# Project Audit & Roadmap — SDC OS
Generated: 2026-07-14 | Agent: Gemini 3.1 Pro | Scope: Full Repo

## 1. Executive Summary
**SDC OS (Student Developer Club Operating System)** is designed to manage the lifecycle of a student developer club. While the core architecture (Next.js 16, Drizzle, Better Auth, BullMQ) is solid and certain features like Event Recruitment and Certificate Generation work well, the project suffers from a "Hollow Shell" syndrome. Several features have fully developed backend schemas and API routes but are completely disconnected from the frontend user interface, creating a mirage of functionality that does not actually exist for the end user.

This audit highlights the structural gaps between the backend and frontend and proposes a concrete roadmap to transform the system into a fully functional product.

## 2. The "Hollow Shells" (Feature Gaps)

After a deep functional audit, the following massive feature gaps have been identified:

### A. Points & Gamification System (Achievements)
- **Database:** The schemas for `pointLogs`, `user.points`, and `achievementSubmissions` are fully implemented.
- **Backend API:** `/api/achievements` contains complete logic to submit achievements, review them, and accurately award points to users.
- **Frontend Reality:** The UI at `/achievements` is completely disconnected from this API. It statically lists `researchPapers` and `competitions` (ignoring the achievements schema entirely). The "Submit Paper" and "Report Win" buttons are dead UI elements (`<Button variant="outline">Submit Paper</Button>`) that do nothing. The `/leaderboard` simply reads the `points` column, which is currently impossible to organically increase through the UI.

### B. Notifications System
- **Database:** The `notifications` table is robust.
- **Backend API:** `/api/notifications` exists to fetch and manage notifications.
- **Frontend Reality:** There is no UI for notifications. The `DashboardLayout` lacks a notification bell, and there is no `/notifications` page. The system is currently incapable of alerting users (e.g., when an application is approved or points are awarded) because there is no interface to consume these alerts.

### C. Vendors & Procurement
- **Database:** `vendors` and `procurementRequests` schemas are fully defined to track club expenditures and vendor quotes.
- **Backend API:** `/api/vendors` and `/api/procurement` exist.
- **Frontend Reality:** There is absolutely no page under `/finance`, `/admin`, or `/lead` to view, manage, or create vendors and procurement requests.

### D. Content Calendar
- **Database:** The `contentItems` schema is designed to track social media and content scheduling.
- **Backend API:** `/api/content` routes are fully built.
- **Frontend Reality:** There is no frontend page for the content calendar.

## 3. Technical Debt & Correctness Issues (Backend)

*Carried over from the previous audit scope.*

1. **Error Handling & Rate Limiting Bypass:** Over 45 API routes implement redundant `try { ... } catch { return NextResponse.json({error}) }` blocks inside the `withApiHandler` wrapper. This effectively swallows internal errors and prevents the global wrapper from correctly handling Zod `ValidationError` and `AuthorizationError`.
2. **Missing Auth Checks:** Several routes (e.g., `/api/content/calendar`, `/api/engagement/leaderboard`) lack `requireSession` or `requireRole` checks. These need to be explicitly documented as public or secured.
3. **N+1 Query Patterns:** 12 API routes execute database queries (e.g., `db.select`, `db.insert`) inside `for...of` loops or `.map()` arrays. This is a severe performance bottleneck for bulk operations (like bulk imports or mass notifications) and needs to be refactored into batch `inArray` or `.values(arr)` inserts.

## 4. Proposed Remediation Roadmap

To fix the Hollow Shells and Technical Debt systematically, development should proceed in the following phases:

### Phase 1: Activate the Points & Gamification Engine
- **Task 1.1:** Overhaul the `/achievements` page to dynamically fetch from the `achievementSubmissions` table.
- **Task 1.2:** Wire up the "Submit Achievement" UI to a Shadcn Dialog containing a form that successfully POSTs to `/api/achievements`.
- **Task 1.3:** Create a Lead/Admin view where officers can review (approve/reject) pending achievements, triggering the backend point distribution and bringing the Leaderboard to life.

### Phase 2: Implement the Notification System
- **Task 2.1:** Build the Notification Bell component and integrate it into the global `DashboardLayout`.
- **Task 2.2:** Connect the frontend to `/api/notifications` via a polling or SSE hook.
- **Task 2.3:** Inject automated notification triggers into key backend actions (e.g., Application Approved, Achievement Granted, Certificate Issued).

### Phase 3: Build Missing Operational UIs
- **Task 3.1:** Create `/finance/procurement` to manage procurement requests and vendors.
- **Task 3.2:** Create `/lead/content` to visualize and manage the content calendar.

### Phase 4: Backend Hardening
- **Task 4.1:** Run a systematic sweep across the 45 affected API routes to remove redundant inner `try/catch` blocks, enforcing the `withApiHandler` boundary.
- **Task 4.2:** Refactor the 12 endpoints suffering from N+1 query loops into vectorized/batch Drizzle queries.
