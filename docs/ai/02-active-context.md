# Active Context

All agents must strictly follow the "Think -> Check -> Implement -> Audit -> Repeat" cycle.

**Current Status:**
The Operations & Finance Agent has successfully completed:
- Inventory Management (DAL fixes, tests)
- Task Board & Delegation (DAL extracted, frontend Kanban board added, tests)
- Finance & Budgets (Overdraw protection, self-approval prevention)
- Procurement & Vendor DB (DAL extracted, self-approval prevention)

**Rule Checklist Status:**
- [x] Environment validated
- [x] Builds and typechecks clean (`npx tsc --noEmit` passes)
- [x] Tests pass (`npm run test` is 100% green)
- [x] Adversarial Audit Passed
- [x] Committed with conventional commits
- [x] Continuity Manifest updated
