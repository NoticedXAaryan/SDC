# 12 — Launch Acceptance and Go-Live Checklist

## Release decision

The release owner may declare the platform ready only when every applicable item below has objective evidence attached. “Works on my machine,” a green-looking page, or a feature table marked complete is insufficient.

## Step-by-step acceptance checklist

1. Record release SHA, deployment artifact/version, migration revision, worker version, environment, approvers, scheduled rollout window, and rollback/forward-fix owner.
2. Confirm that no critical or high security/privacy finding lacks an approved mitigation and expiry date.
3. Confirm that `npm run lint`, type/build, unit tests, isolated integration tests, critical E2E tests, accessibility checks, and visual regression tests pass on the release candidate.
4. Confirm tests did not use production credentials, production database, or live external side effects.
5. Confirm the public landing page works at phone and desktop widths and that the landing footer’s before/after DOM and visual regression test have no difference.
6. Confirm public events, projects, recruitment, privacy/terms, authentication, password reset, and certificate verification work without exposing internal data.
7. Test a member: login, dashboard, event discovery, registration, pass access, notification, achievement/project submission, and settings/privacy action.
8. Test an event lead: draft, approval/return, publish, registration limit/waitlist, session, scanner/manual fallback, offline queue reconcile, attendance review, and certificate issue state.
9. Test a recruitment lead: application queue, review, interview, rejection, approval, role/onboarding handoff, duplicate protection, and audit record.
10. Test finance/inventory: budget creation, expense/procurement create, permission failure, approval/rejection, actuals update, event/inventory link, and audit record.
11. Test an admin/faculty role: member management, audit visibility, privacy limits, system health, emergency/freeze policy if retained, failed-job visibility, and no privilege escalation.
12. Verify unauthenticated and unauthorized direct API calls are denied for every critical mutation.
13. Verify all queues: web enqueues, worker consumes, user/admin sees state, retry is safe, failure alerting works, and duplicate delivery does not duplicate a certificate/email/award.
14. Verify liveness/readiness, database/Redis/worker monitoring, logs, Sentry/event capture, alert routing, backup status, and successful isolated restore rehearsal.
15. Verify image/SVG optimisation, performance budgets, camera/scanner startup, slow-network behaviour, reduced motion, keyboard-only use, zoom, contrast, and screen-reader labels.
16. Verify legal/privacy content, data export/deletion flow, file-access rules, incident contact, and faculty/institutional approvals.
17. Complete a staging event rehearsal with role accounts and realistic synthetic registrations/attendance/certificates. Log every manual workaround; a workaround is a backlog item or launch blocker.
18. Hold formal go/no-go. Every unchecked applicable item must result in `no-go` or a time-bounded written risk acceptance signed by the release owner and product/faculty owner.
19. During rollout, monitor error rate, authentication, queue age/failures, registrations, scanner sync, certificates, database resources, and support channel for the first agreed window.
20. After rollout, run the smoke test from Document 10, communicate support routes, and hold a 24-hour/7-day/30-day review. Convert observed pain into prioritised work—not silent tribal knowledge.

## Non-negotiable no-go conditions

- Lint, build, or required automated tests are failing without a documented and approved temporary waiver.
- Tests can write to production or no isolated integration database is available.
- The critical event → attendance → certificate path is untested or leaves users in an unrecoverable state.
- Authorization can be bypassed through direct requests or sensitive data lacks ownership/retention rules.
- Worker/queue failures are invisible or cannot be safely retried.
- Backups have not been restored successfully in an isolated environment.
- The preserved landing footer has changed.
- The team cannot identify a release owner, incident owner, and rollback/forward-fix path.

## Launch acceptance record

Add a signed Markdown release note in `docs/releases/` using this structure:

```text
Release:
Environment:
Artifact / SHA:
Migration revision:
Web and worker health verified by:
Quality evidence links:
Accessibility/performance evidence links:
Backup restore evidence:
Known risks and expiry:
Rollback / forward-fix owner:
Product owner approval:
Faculty/club approval:
Release owner approval:
```

## Exit criteria

Launch is complete only after a signed record exists, the production smoke test passes, monitoring is active, and the support review dates are on the club calendar.
