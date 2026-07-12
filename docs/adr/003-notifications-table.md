# ADR 003: Simple Notifications vs Novu
**Date:** 2026-07-12
**Decision:** Built a simple `notifications` table instead of adopting Novu.
**Rationale:** Novu requires MongoDB plus 3-4 containers. This adds too much operational complexity and bus factor risk for a college club running on a single Azure VM.
