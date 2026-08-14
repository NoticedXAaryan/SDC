# 01 — Audit Baseline and Governance

## Purpose

This is the starting document for the SOC production-readiness programme. It turns a broad application with many independently useful pieces into one deliberately operated club platform. No feature is considered ready merely because a screen or route exists: a feature must complete a supported end-to-end outcome for a defined role.

## Evidence captured on 2026-08-13

The current repository contains a large Next.js 16 / React 19 application backed by PostgreSQL, Drizzle, Better Auth, Redis/BullMQ, Resend, Sentry, and PostHog. The code graph indexes 5,595 nodes and 7,990 relationships. It includes events, attendance, certificates, recruitment, forms, finance, inventory, projects, engagement, communications, setup, and administration.

The audit also established the following release blockers:

- `npm run lint` fails with 11 errors. Several components declare React components during render; two components reference functions before declaration. These are correctness and maintainability issues, not cosmetic warnings.
- `npm test` has five reproducible landing-page unit-test failures (content validation and schedule normalization). It also has 14 failing test files because the integration suite uses a reachable external PostgreSQL database rather than an isolated disposable test database. The external database was inaccessible from this environment, so those integrations are unverified.
- The repository has existing uncommitted implementation work. Do not overwrite, reset, or fold it into a redesign without its author’s review.
- The existing specification already identifies incomplete or conflicting areas: offline scanner synchronization, AI grading configuration, content pipeline, weekly reports, event sub-events/checklists/staff assignment, and legacy biometric attendance.

This is an assessment, not a claim that every failure is a production bug. Re-run the gates in the target deployment environment before changing the status of an item.

## Governing rules

1. Treat `docs/production-readiness/12-launch-acceptance.md` as the source of truth for launch readiness; a feature registry or an attractive UI is not a release approval.
2. Name one product owner, one technical owner, one release owner, and one faculty/club approver. A single named person may hold several roles for a small club, but the responsibilities must remain explicit.
3. Create one work item per user outcome, not per component. For example, “approved attendee receives a verifiable certificate” is a work item; “certificate modal” is not.
4. Every work item records owner, scope, risk, data involved, role permissions, dependent systems, test evidence, rollout plan, and rollback plan.
5. Maintain three states only: `blocked`, `in progress`, and `accepted`. Do not call a partially connected item “complete.”
6. Freeze net-new modules until the critical outcome map is accepted. Small fixes that remove a blocker remain allowed.
7. Require a design review before changing any shared primitive, shell, navigation, token, auth, database, queue, or public landing section.
8. Use feature flags only for a time-bounded, monitored rollout. A feature that cannot be safely enabled for club staff is not ready to hide behind a flag.
9. Record architectural choices in `docs/adr/` and link the relevant work item. This prevents a later redesign from reintroducing resolved fragmentation.
10. Keep production and test environments physically and logically separate. Tests must never create data in the live club database.

## Step-by-step programme setup

1. Create the delivery board with the owners defined above and copy the release blockers from this document as `P0` items.
2. Snapshot the current main branch, database schema version, environment-variable inventory, worker version, and route inventory. Store the revision SHA in the release board.
3. Make a backup and verify restoration for the production database before any migration or destructive cleanup.
4. Classify every page, API route, server action, worker, and cron trigger as `public`, `member`, `management`, `admin/faculty`, `internal`, or `retire`.
5. Add a single source-of-truth feature register. Each entry must link a page/action, API contract, DAL/service, schema, queue if relevant, notification, audit log, and tests.
6. Mark orphaned pieces—those without a user journey or without an API/service counterpart—as `retire` or `connect`. Do not leave “maybe useful” code discoverable in production navigation.
7. Resolve conflicting product decisions first. The existing product specification declares QR as canonical attendance and biometrics out of scope; do not improve or promote face recognition until the club formally changes that policy.
8. Define a weekly 30-minute triage: review P0/P1 blockers, stalled dependencies, security findings, production errors, and metrics. Close with owners and dates rather than general discussion.
9. Establish a change budget for each release. A release that includes foundation migration, auth changes, schema changes, and visual redesign at once has too broad a blast radius.
10. Require written acceptance evidence for each work item: a test run URL/log, screenshots at mobile and desktop sizes, role-account test results, and a reviewer name.
11. Run the full quality gate after each cohesive slice, not only near launch. Fix lint and unit-test failures before adding additional screens.
12. Treat all release gates as blocking until an explicit waiver lists the owner, expiration date, risk, and mitigation. Expired waivers automatically reopen the blocker.

## Definition of a connected feature

A feature is connected only when a real authorised user can begin from an expected navigation point, complete the action, receive a trustworthy result, and find the resulting data in the next relevant part of the product. At minimum, check:

- the entity exists in the schema and has migration/seed coverage;
- a typed business operation validates the state transition and permissions;
- the route/action returns a stable contract and an actionable error;
- mutations are idempotent where retries are possible and write an audit event;
- queues have retry, dead-letter/failed-job visibility, and a user-facing completion or failure state;
- pages use live data, loading, empty, permission-denied, and error states;
- a mobile user can perform the primary action without hover or horizontal scrolling;
- a role without authority cannot perform the action through either the UI or a direct request;
- tests cover the happy path, a permission failure, and a meaningful edge case.

## Exit criteria

The governance foundation is accepted when the board has owners, all release blockers are represented, every feature is classified, production/test data separation is agreed, and the team has committed to the launch acceptance gate. No new scope should enter the programme without being assessed against this document.
