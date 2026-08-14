# 05 — Backend Consolidation and Contracts

## Goal

The project should remain a modular monolith with a worker process, not become a collection of independently shaped route handlers. The stable flow is:

`UI / server action → API boundary → typed application service or DAL → repository/Drizzle → transaction + audit/outbox → worker/notification`

The current repository has valuable services, DAL modules, repositories, API routes, workers, and server actions, but the production plan must make their responsibilities consistent. For example, event registration is already represented through a service/repository flow, while other operational paths need the same deliberate contract and test coverage.

## Required module boundaries

| Layer | Must do | Must not do |
|---|---|---|
| UI | Render state and invoke typed action/client | Enforce sole authorization or query database directly |
| Route/action | Authenticate, parse, validate, map errors, return a contract | Hold complex business rules or repeat Drizzle queries |
| DAL/application service | Authorize domain operation, enforce lifecycle/invariants, use transactions | Depend on UI or HTTP details |
| Repository | Query/persist data | Make policy decisions |
| Worker | Execute idempotent deferred work and report result | Depend on browser state |
| Notification/audit | Record and communicate observable outcome | Be optional for sensitive mutations |

## Step-by-step consolidation

1. Build a route/action census including method, authentication, required role, parser/schema, rate-limit policy, DAL/service target, audit event, queue, external dependency, and test file.
2. Assign every route/action to a domain owner: identity, members, events, attendance, certificates, recruitment, finance, inventory, forms, engagement, communications, or platform.
3. For each domain, create a typed command/query interface. Commands change state; queries return view-ready models. Do not expose raw Drizzle rows as long-lived API contracts.
4. Move business decisions from route handlers into the appropriate service/DAL one domain at a time. Preserve behaviour with characterization tests before refactoring.
5. Use Zod at the boundary for body, query, path, and multipart inputs. Validate cross-field rules again in the service when a command can be called from more than one boundary.
6. Establish a consistent API error envelope with a stable machine code, human message safe to display, field errors when applicable, and request/correlation ID. Do not leak database stacks or provider errors.
7. Create an authorization policy table per command. Check authorization in the service/DAL, not only in a page or route wrapper. Test a direct API request from a forbidden role.
8. Make every state-changing command idempotent where browser retries, scanner retries, webhooks, or queues can duplicate it. Use database uniqueness constraints and idempotency keys where appropriate.
9. Use a transaction for the primary mutation, lifecycle transition, audit record, and any required outbox/event record. Do not claim a user was approved if the role assignment failed.
10. Standardise audit events: actor, action, entity, entity ID, before/after summary where safe, timestamp, source, request ID, and optional reason.
11. Confirm that every mutating route has an appropriate rate limit, CSRF/session protection, validation, permission check, and audit record. Treat cron and webhook routes as separate trusted boundaries with secret verification.
12. Add a service-level integration test suite against a disposable database. It must exercise actual constraints and migrations, not mocks of Drizzle.
13. Add route-contract tests for validation, unauthenticated, forbidden, success, conflict, and unexpected-error cases.
14. Establish a deprecation path for competing implementations. If a server action and an API route perform the same command, they must call the same service rather than duplicate business logic.
15. Require a code owner review for new direct database access outside repository/DAL folders.

## Domain completion checklist

For each domain, verify its entity lifecycle is finite and documented; allowed transitions are enforced; data ownership is clear; errors are actionable; dependent pages update correctly; audit history is viewable; failed async work is recoverable; and test fixtures cover a realistic role and state.

## Exit criteria

Backend consolidation is accepted when every mutating boundary maps to a typed, authorized domain command, route handlers are thin and consistent, data transitions are transactional/idempotent, and direct database-test evidence exists for each critical domain.
