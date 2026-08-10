# Active Context

**Current Focus:**
The user has requested a comprehensive feature audit to identify broken routes, missing pages, and loops. We need to identify, test, and audit every single feature one by one, and then fix the missing parts.

**Last Actions:**
- Audited full codebase: 42 ✅ features, 6 ⚠️ partial, 1 🔲 stub
- Created `docs/SPECIFICATION.md` — 4-phase development cycle, three-direction analysis (should/shouldn't/missing), multi-level institute scaling model, integration map, UI standards, security framework, and prioritized work order
- Updated `docs/ai/00-project-brief.md` to reference the master spec

**Next Steps (from SPECIFICATION.md §10.2):**
1. Extract `lib/dal/events.ts` and refactor event API routes (Phase 2)
2. Extract remaining DAL modules per §5.2
3. Verify INT-01 through INT-15 integration workflows against EXECUTION_ROADMAP
4. Shadcn → Astryx migration P0/P1 files
5. Add integration tests for top 5 workflows

**Key reference documents:**
- `docs/SPECIFICATION.md` — what to build and in what order
- `docs/ARCHITECTURE.md` — how it works technically
- `docs/EXECUTION_ROADMAP.md` — verification checklist
