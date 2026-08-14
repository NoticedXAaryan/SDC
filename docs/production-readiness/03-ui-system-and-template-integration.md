# 03 — UI System and Template Integration

## Important naming decision

The installed design package is **Astryx Core** (`@astryxdesign/core` 0.1.8), while the request refers to “Asterisk UI.” This plan treats Astryx as the intended primary library because it is already installed and the project documentation calls for it. Confirm the product name with the team before adding a similarly named package. Do not introduce another component system merely because of a naming mismatch.

Shadcn is already configured and has many existing primitives under `components/ui`. Use it only where Astryx does not provide the required accessible primitive or where replacing an established, stable Shadcn component would create needless risk. All new composite patterns must live in the project design system, not as copied one-off snippets.

## Component responsibility model

| Layer | Responsibility | Examples |
|---|---|---|
| Astryx | Accessible layout and interaction primitives | AppShell, TopNav, SideNav, Card, Table, Dialog, Field, EmptyState, Skeleton, Toast |
| Shadcn (exception) | A documented missing primitive or a stable legacy wrapper | Existing form/date/dropdown wrappers, until migrated |
| SOC design system | Brand-specific compositions and tokens | Black-hole mark, cosmic surface, orbital metric, event command panel, status vocabulary |
| Feature module | Domain logic and mapping live data into approved patterns | Registration state, expense approval, attendance reconciliation |

## Template catalogue to build

Use library templates as **compositions**, not static page copies. Each template takes data, roles, empty/error/loading states, and action slots. Keep each in `components/design-system/templates/` with a Storybook-style fixture or dedicated visual test page.

1. `PublicShellTemplate` — public header, responsive navigation, content rail, preserved landing footer slot.
2. `AuthTemplate` — minimal public shell, focused form, secondary help and privacy links.
3. `MemberDashboardTemplate` — next action, upcoming events/pass, progression, notifications.
4. `OperationsDashboardTemplate` — priority queue, KPIs, operational alerts, scoped quick actions.
5. `IndexTableTemplate` — page header, filters, table/cards switch at small widths, empty/loading/error states.
6. `DetailWorkspaceTemplate` — record identity, lifecycle status, contextual tabs, activity, guarded actions.
7. `WizardTemplate` — draft persistence, step navigation, validation summary, review/submit state.
8. `ScannerTemplate` — large camera/action area, connection state, pending offline queue, accessible manual fallback.
9. `ApprovalTemplate` — submitted data, audit context, approve/reject with reason and confirmation.
10. `VerificationTemplate` — public certificate result, revocation state, privacy-safe data, no authenticated chrome.

## Step-by-step implementation

1. Freeze the public landing footer. Its rendered source is `components/landing/SiteFooter.tsx`, composed by `app/page.tsx`. Add DOM/screenshot regression coverage around this exact composition; do not wrap, relocate, re-template, or otherwise alter it.
2. Catalogue every current UI import from Astryx, Shadcn, Radix, and handwritten components. Record usage, migration risk, and whether it is a primitive, composite, or feature component.
3. Read the locally installed Astryx exports before implementation. It includes AppShell, TopNav, SideNav, MobileNav, Card, Table, FormLayout, Field, Dialog, EmptyState, Skeleton, Toast, and related accessible inputs; use its actual APIs rather than guessed template code.
4. Define semantic SOC tokens for canvas, surface, raised surface, text, muted text, focus, positive/warning/danger, orbital violet, cosmic cyan, and lensing lime. Components may consume semantic tokens only; no raw one-off colours in feature files.
5. Create the template catalogue above with representative mock data only in a design-system sandbox. Do not migrate production pages before the template contracts are reviewed.
6. Add a small adapter layer for any legacy Shadcn component kept temporarily. The adapter must expose the SOC token and state vocabulary so feature screens do not depend on Shadcn class names.
7. Migrate shared shell, header, sidebar, buttons, forms, dialogs, tables, empty states, loading states, and status badges first. Avoid changing feature logic in this step.
8. Migrate pages by journey, starting with public/auth, member event participation, then event operations, recruitment, finance/inventory, and administration.
9. For every dialog, decide whether the activity deserves a full route/workspace. Destructive, multi-step, long-form, or audit-sensitive actions should not be trapped in a dialog.
10. Use optimistic updates only for safe, reversible actions. For approvals, finance, roles, and certificates, show authoritative server results and a visible pending state.
11. Provide loading, empty, error, unauthorized, and disabled states in every template. A blank content region is never an acceptable data state.
12. Make the mobile structure intentional: top bar + sheet navigation, one primary action per viewport, 44px+ tap targets, no hover-only control, and a card representation for dense tables.
13. Maintain a component migration ledger. A file may leave Shadcn only when visual review, keyboard test, screen-reader check, and mobile test pass.
14. Delete duplicated feature-local button/card/modal styles only after all consumers use the template or a tokenised primitive.
15. Re-run lint, type/build, unit tests, visual regression tests, and manual keyboard navigation before accepting each template migration.

## Footer protection protocol

The landing footer is the explicit exception to “update everything.” Its current DOM structure, content, links, styling, animations, breakpoints, and interaction behaviour must remain exactly as it is. Do not restyle it to match the new tokens, move it, wrap it in a new layout element that changes layout, or replace its assets. If a global CSS change alters it, scope or revert that global rule. Acceptance requires a before/after desktop and mobile screenshot diff with no intended footer difference.

## Exit criteria

The UI system is accepted when all new pages use approved templates, temporary Shadcn exceptions are documented, UI state coverage is complete, the footer diff is clean, and every migrated page passes mobile, keyboard, and visual review.
