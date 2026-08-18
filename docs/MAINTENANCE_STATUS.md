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

## Open launch blockers

1. Run migrations and all integration suites against an isolated database whose name contains `test`.
2. Reconcile the global `Permissions-Policy: camera=()` header with authenticated scanner routes and verify camera startup in a browser.
3. Decide whether event listings/details are public; README promises public event promotion while `proxy.ts` currently protects `/events`.
4. Run critical E2E, accessibility, visual-regression, queue retry/failure, backup-restore, and staging-rehearsal checks.
5. Complete the signed release record with real SHA, migration revision, evidence links, owners, and faculty approval.

## Next implementation order

1. Isolated database and integration-test gate.
2. Scanner camera policy and browser smoke test.
3. Public-event routing decision and authorization tests.
4. Remaining DAL extraction identified by `SPECIFICATION.md` SUB-01.
5. Release evidence and deployment rehearsal.

Do not mark the platform production-ready until every applicable launch-acceptance item has objective evidence or signed risk acceptance.
