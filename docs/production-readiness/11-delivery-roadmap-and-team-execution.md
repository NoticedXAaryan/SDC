# 11 — Delivery Roadmap and Team Execution

## Release strategy

Deliver vertical slices, not a giant redesign branch. Each slice must make one user outcome materially more complete while reducing architectural debt. Keep the landing footer outside all migration scopes.

## Recommended sequence

### Milestone 0 — Stabilise the foundation

1. Create the isolated test database and CI guard.
2. Fix all lint errors and the reproducible unit-test failures.
3. Establish the feature/route/permission register and retirement list.
4. Resolve the biometrics policy conflict and audit environment secrets.
5. Publish a baseline quality report.

### Milestone 1 — Establish the product shell and visual system

1. Create SOC tokens, asset pipeline, Astryx-based templates, and approved Shadcn exceptions.
2. Lock the landing-footer snapshot test before public UI changes.
3. Rebuild public/auth shell and responsive navigation around the new information architecture.
4. Apply accessible cosmic background/motion system with reduced-motion and performance fallbacks.
5. Complete visual and accessibility review at all standard viewports.

### Milestone 2 — Event lifecycle vertical slice

1. Consolidate event service/DAL contracts and lifecycle transitions.
2. Build the contextual event operations workspace: setup, approval, registration, attendance, staff, checklist, finance/inventory, communications, certificates.
3. Verify online/offline scanner reconciliation and remove/disable unsupported biometric paths.
4. Add end-to-end tests from draft to public verification.
5. Release to staff in staging/event rehearsal and document findings.

### Milestone 3 — People and operations vertical slices

1. Complete applicant-to-member workflow and role/onboarding handoff.
2. Complete finance/procurement/inventory handoffs with atomic budget controls.
3. Complete forms, project, achievement, and recognition flows.
4. Integrate notifications, audit activity, failure states, and operational dashboards.
5. Add test/monitoring evidence per workflow.

### Milestone 4 — Launch readiness

1. Close security/privacy, performance, accessibility, test, and operations gaps.
2. Run a migration and worker rehearsal on staging.
3. Conduct club acceptance with real role accounts and synthetic data.
4. Run launch checklist and staged rollout.
5. Establish 30-day support and improvement cadence.

## Step-by-step team protocol

1. Break each milestone into small PRs that can be tested independently. Do not mix broad reformatting with behaviour changes.
2. For every PR, link the user journey, design template, API contract, schema effect, permission impact, tests, screenshots, and rollout/rollback note.
3. Assign a product reviewer, technical reviewer, and accessibility reviewer for shared UI/workflow work. One person may be all three only with explicit release-owner approval.
4. Use a protected integration branch/staging deployment. Do not use the production database for developer or CI validation.
5. Hold a demo only with live, non-mocked behaviour. Demo empty/error/forbidden states as well as the happy path.
6. Use a “stop the line” rule: newly discovered security issue, data integrity issue, test-environment leak, or critical journey regression pauses feature work until triaged.
7. Maintain a decision log for scope cuts. If a feature cannot be fully connected for launch, remove it from navigation and communicate the cut rather than shipping an inert surface.
8. Maintain an issue template for defects with role, journey, expected/actual, environment, screenshot/log, data sensitivity, severity, and regression test plan.
9. Keep release notes user-focused: what staff can now do, what changed, what is intentionally unavailable, and where to get help.
10. Schedule a first-event support window with technical and club owners present. Real operating feedback is a required input to the first post-launch release.

## Exit criteria

The roadmap is accepted when work is organised by vertical outcome, each milestone has scope and owners, and no team is proceeding on a redesign or backend refactor without a connected journey and measurable acceptance criteria.
