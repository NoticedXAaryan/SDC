# Goal Pack 01 — execution contract and autonomous implementation rules

## Purpose

This is document 1 of 5. It is the entry point for an implementation agent. Read all five Goal Pack documents in numeric order, then read `docs/ai/GEMINI_FLAGSHIP_PLATFORM_BLUEPRINT.md`. Together they define the required product, interaction design, technical constraints, and release gate for SDC OS.

The goal is not to make the interface look busier. The goal is to make club work fast, obvious, safe, and accountable. Every primary screen must let its intended user identify the next important action, complete it in place or in one deliberate flow, understand the result, and recover from an error without hunting through routes.

## Exact execution directive

Use this directive as the project goal:

> Read `docs/ai/GOAL_01_EXECUTION_CONTRACT.md` through `docs/ai/GOAL_05_QUALITY_DEPLOYMENT_COMPLETION.md` and `docs/ai/GEMINI_FLAGSHIP_PLATFORM_BLUEPRINT.md`. Implement the complete Club Operations Platform described there. First restore lint/test/build health; then implement the role-based navigation, shadcn-only interaction system, screen actions, operational workflows, and release gates in the stated order. Do not stop after analysis or mockups. Continue until all acceptance criteria pass. Preserve correct existing behavior, consolidate duplicates, and do not ask the user to choose routine implementation details.

## Scope and outcome

The implementation must deliver one coherent operating system for a student/professional club:

- Members can see what matters now, register for events, access passes/certificates, submit work, and receive actionable notifications.
- Leads can create and operate events, approve/assign work, scan attendance, communicate with a scoped audience, and track execution without spreadsheet detours.
- Admins can run approvals, members, certificates, communications, finances, forms, compliance, and system health from an operational command center.
- Every action has a visible state, server authorization, audit trace, confirmation where needed, error recovery, loading feedback, and a test.

This pack extends the flagship platform blueprint. It does not replace its data, API, certificate, scanner, CSV, email, security, or Docker requirements.

## Non-negotiable design constraints

- Use **shadcn/ui components from `components/ui` only** for application primitives. New primitives must be generated/adapted through the shadcn workflow into `components/ui`; do not import Material UI, Ant Design, Chakra, Mantine, Headless UI, a third-party dashboard kit, or direct Radix/Base UI primitives in feature code.
- Use the installed `lucide-react` package for every icon. Do not add custom inline SVG icon sets, emoji-as-icons, icon fonts, or external image icons for ordinary actions.
- A button must cause a named user action. Do not add decorative buttons merely to increase density. Every button has a label or `aria-label`, a loading state when asynchronous, a disabled reason when unavailable, and an authorized server action/route behind it.
- Preserve visual consistency through existing Tailwind tokens and shadcn component variants. Do not introduce a separate component library, random gradients, glassmorphism, bespoke card systems, or one-off color semantics.
- Prefer a useful next step, inline empty state action, row action menu, contextual sheet, or command palette over forcing users to navigate to a distant page.
- Keep critical actions explicit: confirmation dialog for destructive/cancel/revoke/send-to-many operations; undo where a reversible action is safe; audit reason for privileged overrides.
- Build responsive flows: desktop can use side sheets/tables; mobile uses shadcn Drawer/Sheet, stacked cards, sticky primary action, and touch-friendly targets.
- Treat accessibility as functional behavior: keyboard navigation, focus management, visible focus, correctly associated labels, error announcement, color-independent status, and usable screen-reader text are mandatory.

## Required implementation order

Follow this order. Do not implement polished UI over broken parsing, authorization, data consistency, or deployment.

1. Baseline repair: fix current parsing/lint failures, deterministic test environment, production build, and route authorization inconsistencies.
2. App shell and navigation: implement the role-aware information architecture in Goal Pack 02, including the command menu, global create actions, notification action center, breadcrumbs, and consistent page header.
3. Shared shadcn foundations: add only the approved components/patterns in Goal Pack 03 and build reusable application-level wrappers.
4. Screen actions: implement the screen-by-screen flows in Goal Pack 04, starting with dashboard, events, scanner, certificates, and communications.
5. Operational completion: implement the data/API/worker details from the flagship blueprint for certificates, campaigns, imports, scanner, auth, and deployment.
6. Quality/release: satisfy Goal Pack 05 and run all required validation before declaring completion.

## Codebase facts that shape the work

These current locations must be improved rather than bypassed:

| Existing location | Current limitation | Required treatment |
| --- | --- | --- |
| `components/app-sidebar.tsx` | Navigation is duplicated by role and omits several high-value destinations; “member”, “lead”, and “admin” experiences are not one coherent system. | Replace with a data-driven, role-filtered sidebar and route map. Add command navigation and global actions. |
| `app/(dashboard)/dashboard/components/admin-dashboard.tsx`, `lead-dashboard.tsx`, `student-dashboard.tsx` | Separate dashboards exist but need a common operational pattern and direct next actions. | Keep role-specific data, rebuild around action queue, today view, deadlines, and quick actions. |
| `app/(dashboard)/events/**`, `components/events/**` | Event work is split between listing, details, wizard, controls, sessions, register flow, and scanner routes. | Create canonical list/detail/manage flows and contextual actions; see Goal Pack 04 and blueprint. |
| `components/certificates/**`, `app/(dashboard)/**/certificates/**` | Certificate screens exist but are fragmented and backed by duplicate data models. | Consolidate to one certificate UX/API/data model with template, issue, delivery, verify, revoke actions. |
| `components/scanner/qr-scanner.tsx` and event scanner pages | Multiple QR implementations, no complete barcode/HID experience. | Replace with one purposeful attendance surface and the scanner flow in the blueprint. |
| `app/api/announcements/route.ts`, notifications UI | Announcements are in-app fan-out only, not a user-visible communications workflow. | Build the Communications campaign center, delivery states, and scoped actions. |
| `components/ui/**` | A sound base of Button, Card, Dialog, DropdownMenu, Sidebar, Table, Tabs, Sheet, Select, Sonner, and Tooltip exists. | Reuse and extend through shadcn only; do not invent parallel primitives. |

## Autonomous decision rules

Make the following decisions without interrupting the user:

- Use “Communications” for mass/targeted announcements and “Campaign” for one send. Never expose internal BullMQ “jobs” as a product feature.
- Use a primary CTA only for the most valuable next action on a page. Secondary actions belong in Button outline/ghost variants or a `DropdownMenu`/row menu.
- Use `Dialog` for focused, short, desktop-safe confirmation/forms. Use responsive Dialog/Drawer behavior for compact/mobile workflows. Use `Sheet` for contextual detail/edit flows that benefit from preserving the list behind them.
- Use `AlertDialog` for irreversible actions such as delete, cancel event, revoke certificate, approve/reject with consequences, archive, and send to a large audience.
- Use `Sonner` only for short confirmation/status feedback. Never rely on a toast as the sole presentation of a validation error, import failure, or job result.
- Use server components for protected data views where practical; use client components only for interaction state, scanner/camera, tables, forms, command palette, and optimistic updates.
- Keep URL state for filters, search, date range, tab, pagination, and selected record when it improves shareability/back-button behavior.
- Add new route modules only when the task is substantial. Prefer a tab, Sheet, or Dialog for an action that users should complete without context switching.
- Use the existing authorization helpers and `withApiHandler`; a disabled client button is never authorization.

## Work hygiene

- Start by checking `git status`; the worktree contains prior unfinished changes. Integrate or repair them only after understanding their behavior. Do not use destructive Git commands to discard user work.
- Update or add Drizzle migrations, schema relations, validation, tests, and documentation with each domain change. Do not ship a UI whose API/data state does not exist.
- Do not create fake completion indicators, hard-coded metrics, local-only “success” branches, or nonfunctional controls.
- Do not weaken authentication, verification, rate limits, tenant scope, audit logging, or input validation to make a demo path easier.
- Add stable `data-testid` hooks only where end-to-end tests need them; never use IDs as styling contracts.
- Keep page modules small. Extract repeatable layout/action code to `components/app/**` or an established feature directory, and keep shadcn primitives in `components/ui/**`.

## Completion declaration

Do not report “done” until Goal Pack 05 is satisfied. The final report must state:

- What screens/flows changed and their route paths.
- Which shadcn components were added to `components/ui` and which Lucide icons/patterns were standardized.
- The migration and canonicalization status for events/certificates/communications/imports.
- Exact commands and results for lint, tests, build, migration verification, and Docker smoke test.
- Any intentionally deferred item, limited only to the explicit deferred list in the flagship blueprint.
