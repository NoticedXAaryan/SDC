# Goal Pack 05 — quality gates, testing, deployment, and final completion

## Purpose

This is document 5 of 5. It defines when the redesigned product is actually complete and deployable. An attractive screen, a passing local interaction, or a Docker image that merely builds is not a release gate.

Read Goal Pack 01–04 and `GEMINI_FLAGSHIP_PLATFORM_BLUEPRINT.md` before acting. This document ends autonomous implementation only after the quality gate is satisfied.

## Baseline defects to resolve first

At the time this Goal Pack was written, the repository has known baseline defects:

- `npm run lint` fails with parsing errors in currently uncommitted event/approval work, including `app/(dashboard)/events/create/create-event-wizard.tsx`, `app/(dashboard)/manage/approvals/**`, `app/api/events/[id]/duplicate/route.ts`, `app/api/events/[id]/reject/route.ts`, `app/api/events/[slug]/check-in/route.ts`, and `components/events/register-button.tsx`.
- Lint also reports hook ordering/immutability errors in `app/(dashboard)/manage/forms/page.tsx` and `components/notifications/notification-bell.tsx`, plus an impure `Math.random()` during render in `components/ui/sidebar.tsx`.
- `npm test` runs existing smoke tests but fails `tests/auth.test.ts` before tests execute because validated environment variables are absent.
- The dashboard/event/certificate/scanner work contains overlapping paths and incomplete worktree changes. Reconcile them before feature expansion; do not hide failures with ignores or disable directives.

Resolve all of these in Phase 0. Record the before/after validation output in the final handoff.

## Required validation pipeline

### Static quality

Run from a clean working tree state that preserves intended changes:

1. `npm run lint`
2. Type-check through the project’s appropriate TypeScript/build command.
3. `npm run build`
4. Dependency/security audit appropriate to the lockfile and deployment policy.

Acceptance:

- Zero lint errors. Warnings are reviewed and fixed unless a documented, narrow exception exists.
- No `@ts-ignore`, blanket ESLint disable, unsafe `any`, placeholder `console.log`, or parse workaround is introduced to bypass defects.
- Production Next build completes with the environment contract documented and without leaking server secrets into client bundles.

### Test environment

Create a deterministic test setup before any production module imports validated environment configuration.

- Add `tests/setup.ts`/Vitest config or an equivalent test env mechanism that supplies non-secret valid placeholders for `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `PASS_SECRET`.
- Tests may not read a developer’s `.env.local`, production Neon URL, production Redis, or real Resend credentials.
- Unit tests mock boundaries deliberately. Integration tests use a disposable isolated Postgres/Redis environment and clean only their own data.
- Test names describe user behavior and authorization outcome, not implementation trivia.

### Required automated coverage

| Area | Minimum tests |
| --- | --- |
| Navigation/UI system | Role-filtered sidebar/command actions, keyboard/focus behavior, page primary action, empty/loading/error state. |
| Authorization/tenancy | Attempt all sensitive routes with no session, wrong role, wrong organization, and valid authorized role. |
| Event lifecycle | Draft/create/edit/submit/publish/cancel/complete/archive, invalid transition rejection, audit creation. |
| Registration | Capacity concurrency, waitlist, duplicate registration, invitation, custom response validation, cancellation. |
| Scanner | QR, barcode/HID input normalization, wrong event, expired/invalid token, duplicate scan, offline reconciliation, session attendance. |
| Certificates | Template version immutability, issue idempotency, render/store failure/retry, recipient permission, verification/revoke/reissue, delivery state. |
| Communications | Audience scoping/snapshot/deduplication, suppression, test send, scheduled/send/cancel/retry, partial failure state. |
| CSV | Parser/header/mapping validation, preview, duplicate/conflict policy, idempotency, formula-injection-safe export, organization scope. |
| Auth/email | Registration validation, verification restriction, forgot/reset valid/unknown/expired/used/rate-limited flows, production missing-config failure. |
| Deployment | Migration, web health/readiness, Redis, worker heartbeat, queued email/certificate smoke path. |

Add Playwright (or an equivalent browser E2E runner) for launch-critical journeys. Browser tests must exercise real visible controls—not only API setup—and use test accounts/data isolated from production.

## Required end-to-end scenarios

1. A member signs in, finds an event through the dashboard/command navigation, registers, sees confirmed/waitlist result, opens a pass, and receives an action notification.
2. A lead creates a draft event, adds schedule/registration setup, submits or publishes according to permission, and sees it on the appropriate list.
3. An unauthorized user cannot discover or mutate another organization’s event through a changed URL, command search, export route, scanner request, or row action.
4. A lead imports a roster: maps columns, sees validation warnings, confirms a safe conflict policy, receives import summary/error artifact, and exports a formula-safe roster.
5. An event-day staff member opens the scanner from event context, scans a valid QR and a HID/barcode value, handles an already-scanned attendee, and resolves one offline queued scan.
6. An authorized organizer selects an immutable template version, issues certificates to eligible attendees, sees job progress, views a public verification page, and revokes/reissues with audit reason.
7. An organizer composes an event update, previews exact audience/exclusions, sends a test, schedules/sends, and sees individual delivery states/failures.
8. The login page’s Forgot Password link completes a reset path safely for valid and invalid/expired tokens without user enumeration.
9. An admin processes an approval through the work queue Sheet, supplies a required reason, sees activity timeline/audit result, and returns to the updated queue.
10. At mobile viewport, primary actions, scanner controls, form submission, tables/cards, dialogs/drawers, sidebar, and command menu remain usable by keyboard/touch.

## Performance and resilience requirements

- List pages use server pagination and scoped filtered queries; do not download whole member/registration/certificate/campaign tables to the browser.
- Debounce search and cancel/ignore stale client results.
- Data tables have loading skeletons, meaningful empty/error state, and no layout jump when data arrives.
- Long work is asynchronous: certificate render/delivery, campaign send, large import, report generation. UI shows durable job/progress state and can be revisited after reload.
- APIs receive idempotency keys for scan, issue, import confirmation, and campaign delivery paths. Retry does not duplicate work.
- Worker concurrency/provider rate limits are configured and tested. Failure state is visible to an authorized operator.
- Object-storage/email/Redis/Postgres failures are logged with safe correlation IDs and surfaced as error/readiness state, not false success.

## Security and privacy gate

- Every mutation uses server authorization and organization scope checks; UI permissions are never the only control.
- Validate all input with Zod at the boundary. Validate file MIME, size, count, and CSV headers/content before durable writes.
- CSV exports neutralize formula-leading cells. CSV imports never execute formulas or trust spreadsheet metadata.
- Do not log raw QR tokens, reset URLs/tokens, certificate render inputs containing sensitive details, or full CSV contents.
- Password reset responses do not reveal whether the account exists.
- Email/provider webhooks validate signatures before changing delivery state.
- Public certificate verification exposes only approved public metadata; signed download URLs are short lived and authorized.
- Audit privileged actions: role/membership change, event state override, roster import/export, scan override, campaign send/cancel, certificate issue/revoke/reissue, and settings/security changes.

## Docker/Dokploy release gate

The project deploys through Docker Compose to Dokploy/VPS. Complete the following before automatic push deployment is trusted:

- Keep the web app, migrator, and worker as separate purposeful containers/commands.
- The worker must wait for both Redis health and successful migration completion; it currently lacks the migration dependency.
- Do not run the long-term worker from a bulky builder image with accidental dev-only runtime behavior. Compile/package a reproducible production worker runtime.
- Treat managed Neon/Postgres as production database. If adding local Compose Postgres, gate it behind a documented development profile so production does not connect to an empty unintended database.
- Add health/readiness semantics: `/api/health` reports database/Redis health; `/api/ready` only returns ready when routing dependencies are available; worker heartbeat is visible to authorized operations.
- Validate Redis password/URL consistency, environment injection, secure public app URL, Better Auth URL, object storage credentials, and email configuration.
- Use generated Drizzle migrations in production, never `drizzle-kit push`.
- Document a guarded pre-launch data reset runbook. Normal startup/deploy must never wipe data.

Required Docker smoke test:

```text
1. Start isolated Postgres/Redis/object-storage fake or test equivalent.
2. Run migration container once and verify exit success.
3. Start web + worker.
4. Verify web health and readiness.
5. Queue one fake email and one test certificate render/delivery job.
6. Verify worker heartbeat, durable job state, and failure/retry visibility.
7. Stop/restart worker and verify safe continuation/no duplicate certificate or delivery.
```

## Documentation gate

Before release, update:

- `README.md`: accurate stack versions, local setup, Docker profiles, all required commands, testing, and high-level module map. Remove claims contradicted by Compose.
- `.env.example`: complete categorized variable contract with placeholders only.
- `docs/ai/02-active-context.md`: current state only; remove stale claims after implementation.
- `docs/adr/`: architecture decisions for organization scoping, canonical certificates, communications/campaign delivery, object storage, scanner token/attendance ledger, and deployment worker design.
- Operator runbook: migrations, rollout, health check, backup/recovery, pre-launch reset guard, troubleshooting certificate/campaign/import jobs.
- User help: event registration/pass, attendance scanner, certificate verification, import CSV template/mapping, communications campaign safety, password reset.

## Final release checklist

- [ ] All five Goal Pack documents and the flagship blueprint are implemented, not merely acknowledged.
- [ ] No duplicate active certificate, scanner, event-management, or announcement implementation remains.
- [ ] All affected screens have role-aware navigation, purposeful actions, real statuses, loading/error/empty states, responsive behavior, and accessibility verification.
- [ ] New UI uses local shadcn primitives and Lucide icons only.
- [ ] Every action has a real authorized backend behavior, audit behavior when significant, and automated coverage.
- [ ] `npm run lint` passes with zero errors.
- [ ] `npm test` passes with safe deterministic test setup.
- [ ] Production build/type validation passes.
- [ ] Drizzle migrations apply cleanly to a fresh database and an upgrade path is tested.
- [ ] Docker web/migrator/worker smoke test passes and health/readiness/heartbeat behave correctly.
- [ ] Documentation and env contract match the actual implementation.

## Final reporting format

When all work is complete, report in this order:

1. Product outcome: the user journeys and flagship flows that now work.
2. Architecture/data outcome: canonical models/migrations and retired duplicate paths.
3. UI outcome: shared shadcn components/patterns and key route changes.
4. Reliability outcome: test suite, build, Docker health, worker/email/storage behavior.
5. Validation evidence: exact commands run and concise pass results.
6. Deferred work: only items explicitly deferred by the flagship blueprint.

Do not call the work complete if a required command, test, migration, Docker smoke check, or launch-critical path remains unverified.
