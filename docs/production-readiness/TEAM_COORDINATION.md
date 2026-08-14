# SOC Three-Agent Coordination Protocol

This file is the durable coordination record for the agents working from `THREE_AGENT_PROMPTS.md`.

## Roles

| Agent name | Owns | Must consult |
|---|---|---|
| `systems-integrator` | Backend contracts, workflows, auth/security, test environment, data integrity | `release-guardian` before migrations/tests; `experience-engineer` before API/UI contract changes |
| `experience-engineer` | Information architecture, Astryx-first UI templates, responsive/accessibility work, space visual system | `systems-integrator` before changing data/actions; `release-guardian` before shared UI/migration acceptance |
| `release-guardian` | Quality gates, CI/test isolation, deployment, observability, release approval | Both agents before accepting a slice; both agents after any release blocker is found |

## Communication rules

1. Use direct agent messages as the primary channel. Address messages to the two named roles and include the message format below.
2. If direct messages are unavailable, append the same format under **Message log**. Do not rewrite or delete another agent’s entry.
3. Send a `START` message before editing, a `CONTRACT` message before altering any shared API/schema/template, a `BLOCKED` message immediately when blocked, and a `HANDOFF` message before declaring a slice ready for review.
4. Make small, focused commits/changes. Do not edit files another agent has declared active without asking first.
5. Read `docs/production-readiness/01-audit-baseline-and-governance.md` and this file at the beginning of each work block. Follow the launch gates in `12-launch-acceptance.md`.
6. The landing footer is `components/landing/SiteFooter.tsx`, composed by `app/page.tsx`, and is protected. No agent may intentionally change its markup, content, styling, interaction, placement, or visual appearance.
7. When a decision crosses ownership boundaries, wait for acknowledgement from the affected owner or record an explicit temporary decision here.

## Message format

```text
[TO: systems-integrator, experience-engineer, release-guardian]
[TYPE: START | CONTRACT | BLOCKED | HANDOFF | DECISION]
Scope: <one sentence>
Files/contracts affected: <paths or “none”>
Dependency/request: <what the recipients need to know or do>
Evidence/status: <tests, screenshots, decision, or blocker>
```

## Active ownership

| Area or file group | Owner | State | Notes |
|---|---|---|---|
| Backend/DAL, routes, schema, workers, security | systems-integrator | accepted | DB Isolation, Event→Cert Queue Complete |
| UI, components, public/auth/dashboard shells, visual assets | experience-engineer | accepted | Lints, Mobile, Accessible states Complete |
| Tests, CI, deployment, monitoring, release evidence | release-guardian | accepted | Playwright, CI, Observability Complete |

## Message log

Append-only fallback log. Newest entries go at the bottom.

---

```text
[TO: experience-engineer, release-guardian]
[TYPE: START]
Scope: systems-integrator beginning SOC backend integration — applicant→member, event→attendance→certificate, and finance/inventory handoffs.
Files/contracts affected: lib/dal/*, lib/services/*, lib/validators/*, lib/workers/*, tests/integration/*
Dependency/request:
  - experience-engineer: Do NOT touch lib/dal/*, lib/services/*, lib/validators/* until HANDOFF is sent for each slice. I will send CONTRACT before any API shape change.
  - release-guardian: Expect HANDOFF messages with test evidence for each slice. DB must be isolated (vitest + disposable test DB pattern via setup.ts).
Evidence/status: Reading docs/production-readiness/01,05,06,07 and TEAM_COORDINATION.md. No schema migrations needed — existing schema covers all required entities. Work begins immediately on three slices in parallel.
```
2026-08-13T23:30:00+05:30 — systems-integrator

---

[TO: systems-integrator, release-guardian]
[FROM: experience-engineer]
[TYPE: START]
[DATE: 2026-08-13]
Scope: Beginning full SOC UX overhaul — Astryx-first responsive UI, information architecture, accessibility, and refined black-hole/space visual design system.
Files/contracts affected:
  - app/globals.css (SOC design tokens, motion presets, cosmic utilities)
  - components/astryx/* (enhanced Astryx wrappers — page-header, empty-state, status-badge, metric-card, data-table, app-topnav, app-sidenav, app-mobile-nav)
  - components/design-system/* (new: CosmicBackground, StarField, BlackHoleLoader, OrbitalMetric, LensingDivider, StatusVocabulary)
  - app/(dashboard)/* page files — adding loading.tsx, error.tsx, not-found.tsx per route
  - app/(auth)/layout.tsx — auth shell (no footer touch)
  - components/landing/SiteFooter.tsx — PROTECTED, will NOT touch
Dependency/request:
  - systems-integrator: Please confirm current API shapes for /api/events, /api/dashboard, /api/applications — need to know error response envelope.
  - release-guardian: Will send HANDOFF with screenshots and accessibility pass before merging each slice. Please hold QA gate.
Evidence/status: Reading docs/production-readiness/02,03,04,09 and TEAM_COORDINATION.md complete. Beginning implementation.
