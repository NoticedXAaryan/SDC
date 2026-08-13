# Student Developer Club (SDC) Platform

> An all-in-one management solution for college-level educational institute clubs, handling everything from public presence and membership to event scanners, certificates, recruitment, finance, inventory, and communications.

---

## 📖 Overview

The SDC Platform is designed for hierarchical institute structures, supporting the complete operational lifecycle of a student club. It serves a **dual purpose**:
1. **Public Website:** Landing page, event promotion, project showcase, and public certificate verification for prospective members and the general public.
2. **Authenticated Operations:** A secure, role-based dashboard for members, leads, admins, and faculty coordinators to manage day-to-day operations behind a login.

### 🌟 Core Modules
- **Identity & Access:** 14-role RBAC, disposable email blocking, university email auto-promotion, password resets.
- **Members & Directory:** Directory search, role management, org chart, gamification (points & levels).
- **Events & Attendance:** Full CRUD with lifecycle management, waitlists, multi-session support, camera-based QR check-ins, and offline scanning capabilities.
- **Certificates:** Template designer, bulk generation via BullMQ, public verification, and revocation.
- **Recruitment:** Dynamic application forms, AI application grading, interview scheduling, and automated approval workflows.
- **Finance & Procurement:** Budgets, expense workflows, income tracking, and vendor directory.
- **Inventory:** Item tracking, check-in/out audit logs, low-stock alerts.
- **Forms:** Dynamic form builder with 9+ field types, visibility logic, and response collection.
- **Projects & Engagement:** Project submissions, achievement tracking, and leaderboards.
- **Communications:** Event email blasts, system announcements, in-app notifications, and React Email templates.

---

## 🛠 Tech Stack

The architecture is built for performance, security, and scalability using a modern layered approach:

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, `@astryxdesign/core` |
| **Backend** | Next.js API Routes, Drizzle ORM, PostgreSQL |
| **Auth** | Better Auth with custom 14-role RBAC hierarchy |
| **Background Jobs** | BullMQ + Redis (email blasts, certificates, AI grading) |
| **Email** | Resend + React Email |
| **Monitoring** | Sentry (errors), PostHog (analytics) |
| **Deployment** | Docker (standalone), Docker Compose |

---

## 🚀 Quick Start & Development Setup

Follow these steps to get the platform running locally.

### 1. Prerequisites
- **Node.js:** ≥ 22
- **PostgreSQL:** A running PostgreSQL instance (or use Neon/Supabase).
- **Redis:** A running Redis instance (required for BullMQ and rate limiting).

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd sdc-platform
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env.local
```
Fill in the required variables in `.env.local`:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: Generate a secure random string.
- `BETTER_AUTH_URL`: e.g., `http://localhost:3000`.
- `PASS_SECRET`: Secure string for QR generation.
- `REDIS_URL`: Your Redis connection string.
- `ADMIN_EMAIL`: Email address that will be auto-promoted to `owner`.

### 4. Database Setup
Push the schema to your database and optionally seed it:
```bash
npm run db:push       # Or use npm run db:migrate if you have migrations generated
npm run db:seed       # (Optional) Seed with development data
```
To view your data during development, you can use Drizzle Studio:
```bash
npm run db:studio
```

### 5. Running the Application
You need to run both the web app and the background worker process.

**Terminal 1 (Web App):**
```bash
npm run dev
```
*The app will be available at `http://localhost:3000`.*

**Terminal 2 (Background Workers):**
```bash
npm run worker
```

*Alternatively, use Docker Compose to spin everything up:*
```bash
docker-compose up --build
```

---

## 🏗 Architecture & Codebase Guidelines

The codebase strictly follows a **layered architecture** to keep logic clean and maintainable. All new code must adhere to this structure:

1. **UI Layer** (`app/`, `components/`): Renders data. Uses `@astryxdesign/core`. No direct DB access.
2. **API Layer** (`app/api/`): Thin wrappers that use `withApiHandler` for rate limiting, enforce Zod validation, and call DAL functions.
3. **DAL (Data Access Layer)** (`lib/dal/`): Contains all business logic, queries, and role-based access checks.
4. **Service Layer** (`lib/services/`): Third-party integrations (Resend, Storage, AI).
5. **Worker Layer** (`lib/workers/`): BullMQ asynchronous jobs.
6. **Data Layer** (`lib/db/`): Drizzle ORM schemas.

### Anti-Patterns to Avoid
- 🚫 **Inline SQL in Route Handlers:** Always extract DB queries to `lib/dal/`.
- 🚫 **Skipping Audit Logs:** Call `logAuditEvent()` in every mutating operation.
- 🚫 **Shadcn UI for new components:** Use `@astryxdesign/core` components instead.
- 🚫 **Direct UI Role Checks:** Ensure role gates are enforced in the DAL and API, not just by hiding UI elements.

---

## 📚 Documentation

For an in-depth understanding of the system, refer to the following documents in the `docs/` folder:

1. **`docs/SPECIFICATION.md`**: The master development specification detailing the core features, out-of-scope features, gap analysis, and the 4-phase implementation cycle.
2. **`docs/ARCHITECTURE.md`**: Technical reference containing Data Flow Diagrams, full database schema maps (30+ tables), API route inventory, and the complete role hierarchy.
3. **`docs/EXECUTION_ROADMAP.md`**: Step-by-step verification checklist for QA.

---

## 🔒 Security

Security is deeply integrated at multiple layers:
- **Route Protection:** Handled via `proxy.ts` and DAL-level authorization.
- **RBAC:** Strict 14-role hierarchy enforced before any data access.
- **Rate Limiting:** Redis-backed protection on all mutating routes via `withApiHandler`.
- **Validation:** 100% Zod schema coverage for API inputs.
- **Audit Trails:** Comprehensive tracking of all changes in the `audit_logs` table.
- **Bot Protection & Headers:** Cloudflare Turnstile integration, HSTS, CSP, and X-Frame-Options DENY.
