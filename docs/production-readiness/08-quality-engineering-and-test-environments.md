# 08 — Quality Engineering and Test Environments

## Current findings

The present quality gate is red. `npm run lint` reports 11 errors. The test command reports five failing landing unit tests and 14 failed test files; the integration failures attempted to reach an external PostgreSQL host and therefore could not validate application behaviour in this environment. The test run reports 42 passed, 5 failed, and 44 skipped tests across 22 test files. These numbers are a baseline, not an acceptable release status.

## Step-by-step quality recovery

1. Preserve the failing output in the release board and reproduce each lint/unit failure locally before changing unrelated code.
2. Fix lint errors correctly rather than silencing rules. Move component declarations outside render, establish stable callback/function ordering, and remove only genuinely unused suppressions. Add a regression test if the fix changes behaviour.
3. Repair the landing content-validation tests and schedule-loader tests. The schedule failures show malformed/undefined date handling in the test path; decide and document whether malformed schedule rows are quarantined, rejected, or normalised, then align code and tests.
4. Replace production/external database dependence in tests with an isolated test database. Use a dedicated `DATABASE_URL` that cannot point to production, run migrations from scratch, and drop/reset only that explicitly verified target.
5. Add a test environment guard that aborts if the database hostname/name matches a production allow-list or if `NODE_ENV=test`/a test-specific marker is absent.
6. Seed role-based fixtures through builders, not shared mutable data. Each test owns its records and cleanup.
7. Split tests into fast unit, component, integration, contract, end-to-end, accessibility, and visual suites. A local developer should be able to run fast checks without credentials for external services.
8. Mock only third-party boundaries in unit tests. Integration tests should use real migrations, database constraints, and a local/fake queue adapter.
9. Add service/DAL integration coverage for: event capacity/waitlist, scan duplicate prevention/offline reconciliation, certificate eligibility/issue/revoke, recruitment approval, finance budget limits, role changes, form visibility, and account privacy operations.
10. Add API contract tests for authentication, authorization, invalid input, conflict, rate-limit behaviour, idempotency, and stable error envelopes.
11. Add end-to-end browser flows with disposable data for the six canonical journeys in Document 02. Run at phone and desktop breakpoints.
12. Add visual regression coverage for public pages, auth, dashboard, event creation, scanner, tables/cards, empty/error states, and the explicitly protected landing footer.
13. Add automated accessibility checks plus manual keyboard, focus order, screen-reader label, colour-contrast, zoom, and reduced-motion testing.
14. Run performance tests against public pages and operational hot paths: landing LCP/CLS/INP, event listing, event detail, table filtering, scanner startup, and large certificate issuance status.
15. Make CI required: format/lint, type/build, unit/component, isolated integration, contract, selected E2E, security scan, and migration check. Quarantine no test without an issue, owner, reason, and expiry date.
16. Publish concise test artefacts: test counts, failed tests, coverage by critical journey, screenshots, performance budgets, and test database migration revision.

## Test data and service doubles

Create local doubles for Resend, Sentry, PostHog, OpenRouter, cloud storage, Redis/BullMQ, Turnstile, and GitHub. Contract-test their adapters separately. The default test suite must never require real mail delivery, AI calls, credentials, external CDNs, or a shared production-like database.

## Exit criteria

Quality engineering is accepted when lint, build, and required tests pass deterministically; integration tests use an isolated database; every canonical journey has automated coverage; and the red baseline has been replaced with published, reproducible evidence.
