# Maintenance Status

Last verified: 2026-08-18

## Release decision

**NO-GO.** The application builds, but the launch-acceptance evidence in `production-readiness/12-launch-acceptance.md` is not complete.

## Verified gates

| Gate | Result | Evidence |
|---|---|---|
| ESLint | Pass | `npm run lint` |
| TypeScript | Pass | `npx tsc --noEmit` |
| Production build | Pass | `npm run build` with Next.js 16.2.10 |
| Unit-level Vitest suites | Pass | 10 files, 53 tests |
| Integration suites | Blocked | Test PostgreSQL was unreachable; Vitest excluded `tests/integration/**` |

## Completed in this checkpoint

- Repaired `/api/announcements` so it builds and uses the documented route → service → DAL structure.
- Added bounded Zod validation and safe link validation.
- Made notification, communication, and audit writes transactional.
- Added a dedicated global announcement email job instead of incorrectly querying event registrations.
- Added queued, queue-failed, partial, and sent delivery states with audit evidence.

## Completed in the account lifecycle checkpoint

- Added a shared member DAL and moved member listing and role mutations out of route handlers.
- Added profile editing, protected role changes, filtered pagination, temporary/permanent bans, unban, session revocation, and owner-only account deletion.
- Added self-management, executive-role, and final-owner safeguards with transactional audit records.
- Added an Astryx account-management dialog with status details and explicit destructive-action confirmation.
- Reconciled the legacy role endpoint and navigation with the admin/owner authorization policy.
- Kept the product's documented community model as club domains/teams; a separate chat/community product remains outside the v1 scope.
- TypeScript compilation and the Next.js 16.2.10 production build passed for this checkpoint. Broad test execution is deferred during the implementation-first pass.

## Open launch blockers

1. Run migrations and all integration suites against an isolated database whose name contains `test`.
2. Reconcile the global `Permissions-Policy: camera=()` header with authenticated scanner routes and verify camera startup in a browser.
3. Decide whether event listings/details are public; README promises public event promotion while `proxy.ts` currently protects `/events`.
4. Run critical E2E, accessibility, visual-regression, queue retry/failure, backup-restore, and staging-rehearsal checks.
5. Complete the signed release record with real SHA, migration revision, evidence links, owners, and faculty approval.

## Next implementation order

1. Make certificate files durable across the app and worker Docker containers.
2. Make achievement approval idempotent and complete reward/redemption side features.
3. Harden AI data handling, provider consistency, and fallback behavior.
4. Complete remaining DAL extraction and UI consistency work.
5. Reconcile scanner camera policy and public event routing.
6. Resume integration, E2E, accessibility, visual, backup, and staging evidence after implementation stabilizes.

Do not mark the platform production-ready until every applicable launch-acceptance item has objective evidence or signed risk acceptance.
