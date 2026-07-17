# Goal Pack 03 — shadcn/ui-only design and interaction system

## Purpose

This is document 3 of 5. It defines the only permitted application UI system. Use it to make the product clearer and more capable without turning it into a collage of unrelated components.

The codebase already contains shadcn-style primitives in `components/ui`, Tailwind CSS, `lucide-react`, `date-fns`, React Hook Form, Zod, and Sonner. Extend that foundation. The official shadcn component catalog includes the primitives needed for this product, including Command, Data Table patterns, Drawer, Field, Pagination, Calendar, Chart, Empty, and more. Use the project-local generated component source rather than importing external UI kits. [shadcn component catalog](https://ui.shadcn.com/docs/components)

## Hard component boundary

Allowed:

- `@/components/ui/*` generated/adapted through shadcn.
- `lucide-react` for icons.
- Existing Tailwind/tokens and `cn` utility.
- React Hook Form/Zod for forms.
- Existing `sonner` integration for transient feedback.
- Recharts/TanStack Table only when introduced through the official shadcn Chart/Data Table pattern and justified by a real screen requirement.

Forbidden in feature code:

- Material UI, Ant Design, Chakra, Mantine, Semantic UI, Bootstrap, DaisyUI, PrimeReact, Flowbite, or any full component kit.
- Direct `@radix-ui/*` or `@base-ui/react` imports outside a project-local shadcn primitive implementation.
- New third-party icon packs, inline SVG action icons, emoji controls, or image-based controls.
- Custom unreviewed modal, menu, select, tooltip, toast, date picker, table, or button implementations when shadcn already provides the primitive.

If a missing primitive is needed, add it using the shadcn CLI/manual implementation into `components/ui` and document it below. It must inherit project tokens, keyboard behavior, focus handling, and test coverage.

## Component inventory

### Reuse as-is or standardize

The repository already has these local primitives and should standardize their use:

- Alert, Avatar, Badge, Button, Card, Checkbox, Dialog, DropdownMenu, Form, Input, Label, Popover, Select, Separator, Sheet, Sidebar, Skeleton, Sonner, Switch, Table, Tabs, Textarea, Tooltip.

### Add through shadcn before feature work

Add only the primitives that implement the specified workflows:

| Primitive | Product use | Required behavior |
| --- | --- | --- |
| AlertDialog | Destructive/high-impact confirmation | Used for delete, archive, cancel event, revoke certificate, reject/approve when consequential, large campaign send. |
| Command | Global navigation/search/actions | Command palette with `CommandDialog`, groups, shortcut, loading/empty, server-scoped results. |
| Drawer | Mobile counterpart for local workflow | Responsive edit/inspection composition with Dialog on desktop and Drawer on mobile. Official shadcn docs support this responsive composition. [Drawer](https://ui.shadcn.com/docs/components/base/drawer) |
| Breadcrumb | Protected resource context | Every nested resource page shows path and links. |
| Pagination | Lists/rosters/audit/import history | URL-backed pages, disabled states, accessible labels. |
| Calendar / Date Picker | Event dates, campaign schedules, date filters | Keyboard accessible, timezone-aware conversion at form boundary. |
| Field | Reliable form layouts | Labels, descriptions, required indicators, messages, fieldset/group semantics. |
| InputOTP | Optional verification/reset code flow if required by auth design | Do not use for arbitrary ornamental code input. |
| Progress | Upload/import/certificate/campaign progress | Determinate where percent is real; indeterminate spinner otherwise. |
| Empty | First-class empty state | Module-specific icon/message/CTA. |
| ScrollArea | Long notification menus, sheets, audit history, command results | Preserve accessibility and sticky footer/header actions. |
| Accordion / Collapsible | Advanced settings, FAQ-like help, audit payload details | Do not use for primary navigation. |
| ToggleGroup | Compact view/filter mode switcher | Use only when options are mutually exclusive and labelled. |
| Combobox | Large member/template/event selectors | Server search and keyboard selection; not a select with hundreds of DOM nodes. |
| Data Table pattern | Members, registrations, certificates, campaigns, imports, audit logs | Build reusable column/header/pagination/row-action pieces with shadcn Table. [Data Table](https://ui.shadcn.com/docs/components/base/data-table) |
| Chart | Admin/lead trend metrics | Only where a time-series/segment answers an operational question and includes a table/summary alternative. |
| Kbd | Command keyboard shortcut hints | Use in command palette and selected power-user actions. |

Do not add a component preemptively. Add it when a screen in Goal Pack 04 uses it and include it in the local source tree.

## Shared app-level compositions

Build these reusable compositions from shadcn primitives. They are application components, not a new UI library.

### `PageHeader`

Location: `components/app/page-header.tsx`.

Inputs: breadcrumb items, icon, title, description optional, status/metadata optional, `primaryAction`, secondary actions, children for filter controls.

Layout:

- Desktop: breadcrumb row, title/icon/status, description/meta, actions right-aligned.
- Mobile: title/status first, actions wrap or primary action full width; no clipped command labels.
- One primary action maximum. Secondary actions become outline/ghost buttons or an overflow menu.

### `ResourceActionMenu`

Location: `components/app/resource-action-menu.tsx`.

Use a `DropdownMenu` triggered by a ghost icon Button with `MoreHorizontal` and accessible label such as “Actions for DevFest 2026”.

Order actions by frequency/risk:

1. View/open.
2. Common contextual action (edit, duplicate, scan, export).
3. Grouped management action (archive, change status, view activity).
4. Destructive action separated by `DropdownMenuSeparator` and styled destructive only where necessary.

Never hide the only critical next step inside the menu.

### `ResponsiveFormSurface`

Location: `components/app/responsive-form-surface.tsx` or feature-local equivalent.

Use a Dialog on medium/large layouts and a bottom/right Drawer on mobile for short create/edit forms. Forms must use Field, Label, description, inline Zod error message, clear required marker, and sticky footer with Cancel/Submit. Preserve unsaved input when server validation fails.

Use a full page wizard instead for event creation, certificate designer, large imports, and complex form builder workflows.

### `DataTable` family

Create reusable *patterns*, not a single universal opaque data grid:

- `data-table-column-header.tsx`: sort and hide action where relevant.
- `data-table-pagination.tsx`: page controls, count, page size only when server supports it.
- `data-table-toolbar.tsx`: search, filter chips, date range, column visibility, export/clear filters.
- `data-table-row-actions.tsx`: typed action menu.
- `bulk-action-bar.tsx`: appears only after selection and names selected count/action.

Use server pagination/filtering for members, registrations, certificates, campaigns, imports, and audit logs. The official shadcn pattern expects screens to compose their own table behavior; do not force distinct resources into one hard-coded grid. [Data Table guidance](https://ui.shadcn.com/docs/components/radix/data-table)

### `StatusBadge`

Location: `components/app/status-badge.tsx`.

Map canonical domain statuses to badge variant, Lucide glyph optional, text, and screen-reader label. It must not be a giant global enum with arbitrary strings. Either compose typed domain mappings or share a small semantic status palette.

Semantic colors:

- Neutral: draft/archived/inactive.
- Info: scheduled/published/in progress.
- Success: confirmed/issued/delivered/completed.
- Warning: pending/waitlist/action required/retry.
- Destructive: cancelled/revoked/failed/rejected.

Never use a color without visible label text. Never use red for an ordinary disabled state.

### `ActivityTimeline`

Location: `components/app/activity-timeline.tsx`.

Use Card, Avatar, Badge, Separator, Tooltip, and accessible timestamps to render audit/activity history on resource pages. It must display actor, action, readable summary, time, and a collapsible safe detail view. It must not display secrets, raw tokens, or full personal-data payloads.

## Buttons and action hierarchy

### Variants

Use the local shadcn Button variants consistently.

| Variant | Use | Examples |
| --- | --- | --- |
| Default | Single page-level primary action | Create event, Compose campaign, Save changes, Scan attendance. |
| Secondary | Contextual, non-destructive action when hierarchy allows | Preview, Add session, View pass. |
| Outline | Visible secondary action | Export roster, Duplicate event, Manage templates. |
| Ghost | Toolbar/row/icon action | Table row menu, notification action, sidebar action. |
| Destructive | Confirmed terminal destructive action only | Revoke certificate, cancel event, delete draft. |
| Link | Tertiary navigation inside explanatory text | View all registrations, learn why. |

### Icon rules

- Use the standard Lucide icon on the left of a labelled primary/secondary action when it improves scanability: `Plus`, `Send`, `ScanLine`, `Upload`, `Download`, `CalendarPlus`, `Award`, `Users`, `FileText`, `Settings2`.
- An icon-only Button is permitted only where space is constrained or the action is universally recognizable. It requires `aria-label`, Tooltip, 44px touch target on mobile, and no ambiguity: `MoreHorizontal`, `X`, `ChevronLeft`, `Bell`, `Menu`, `Search`, `SlidersHorizontal`.
- Match icon to action; do not reuse a generic gear for edit, send, scan, and export.
- Do not place icons in every static text/card title merely for decoration. They should contribute navigation, semantic recognition, or action.

### Async behavior

Every server-backed button must:

1. Prevent double submit while pending.
2. Change label or show a local Spinner plus accessible busy state, e.g. “Sending…”, “Issuing 32 certificates…”.
3. Preserve/restore state correctly after failure.
4. Show precise inline error or Alert for form-level failure; use Sonner for short success/noncritical updates.
5. Revalidate/update the changed list/count without a full manual refresh.

Use optimistic updates only for safe, reversible actions such as mark notification read, save a local preference, or star/bookmark. Do not optimistically claim email sent, certificate issued, import complete, or attendance accepted before the server confirms.

## Forms

Form standards apply everywhere:

- Use React Hook Form + Zod schema shared with the server where possible.
- Group related inputs in FieldSet/FieldGroup; do not make long forms into undifferentiated vertical input piles.
- Add concise description below unfamiliar/policy-sensitive fields such as visibility, capacity, recipients, template version, revocation reason, and import conflict handling.
- Validate on useful boundaries: blur/step advance and submit. Do not present every error on the first keystroke.
- Place field error directly adjacent to the field, focus the first invalid field after submit, and summarize multi-step errors in a visible Alert.
- Disable submit only when the form is invalid/pending or user lacks permission; explain a disabled state where it is not obvious.
- Provide cancel/back navigation and unsaved-change confirmation for long forms/wizards.
- Date/time UI must show club timezone and convert to UTC at a controlled boundary.

## Responsive and accessibility acceptance rules

- Sidebar collapses/off-canvas at the chosen responsive breakpoint; the primary action remains reachable.
- Tables provide usable compact-card or horizontally scrollable behavior, with priority columns preserved and row actions available.
- Dialog/Drawer focus is correctly trapped/restored; Escape behavior follows action risk and unsaved-change policy.
- Tooltips do not contain information that is otherwise unavailable by keyboard/touch. Icon-only actions have labels.
- Every status/action has text/ARIA, not only a color/icon.
- Contrast, focus ring, visible selected state, keyboard tab order, and reduced-motion-safe interaction are verified with automated/manual tests.
- Charts have a textual summary/table equivalent and do not become the only way to understand operational data.

## UI system acceptance criteria

- Search shows no imports from disallowed UI libraries in feature code.
- New UI primitives live in `components/ui` and are documented in this file.
- Every page in Goal Pack 04 uses `PageHeader`, standard status badges, a consistent empty/loading/error pattern, and authorized action hierarchy.
- A keyboard user can navigate sidebar, open command menu, search, open a resource, use row actions, submit/cancel a Dialog, and return focus predictably.
- The interface contains more useful actions and icons only where they remove work or ambiguity; no inert/placeholder controls remain.
