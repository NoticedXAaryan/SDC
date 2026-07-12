# ADR 002: Custom Tasks Table vs External Tool
**Date:** 2026-07-12
**Decision:** Build a simple generic `tasks` table with polymorphic links instead of integrating Plane/Vikunja.
**Rationale:** Integrating a full OSS project management tool would require keeping identity/auth in sync and managing webhooks just to attach simple checklists to our internal records.
