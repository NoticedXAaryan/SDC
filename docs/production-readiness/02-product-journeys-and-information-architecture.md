# 02 — Product Journeys and Information Architecture

## Purpose

The application currently exposes a rich set of club capabilities. This document makes them feel like one product by defining the few complete journeys people actually need, then shaping navigation and screens around those journeys.

## Canonical club journeys

| Journey | Primary actor | Successful outcome |
|---|---|---|
| Discover and join | Visitor/applicant | Finds the club, understands its value, applies, and receives a clear status |
| Become a member | Recruitment lead | Reviews application, schedules interview, approves, assigns role, informs applicant |
| Run an event | Event lead | Plans, approves, publishes, registers attendees, scans attendance, closes event, reports outcome |
| Recognise attendance | Event lead/member | Eligible attendee receives one correct, verifiable certificate |
| Manage resources | Finance/inventory lead | Allocates budget, requests/approves spend, reserves inventory, and reconciles actual use |
| Contribute and grow | Member/lead | Submits project or achievement, receives review/points, sees progression |
| Govern the club | Admin/faculty | Sees audit trail, operational health, member state, and safe controls |

## Navigation model

Keep the public site and operations workspace clearly separate. A visitor should never have to infer internal club processes from the marketing navigation, and a staff member should not need to rediscover operational modules through a public home page.

- Public: Home, Events, Projects, Recruitment, Certificate verification, About/Contact, Login.
- Member workspace: Home, My events/passes, Achievements, Certificates, Projects, Notifications, Profile.
- Leadership workspace: Event operations, Recruitment, Forms, Inventory, Finance, Content, Reports.
- Administration: Members, Approvals, Audit, Club setup/settings, System health.

Show only the sections an authenticated role may use. Never rely on hiding a link as the permission system—the route and business operation must still deny unauthorised requests.

## Step-by-step information-architecture redesign

1. Inventory every current page and assign it to one of the four areas above or mark it for retirement. Include routes that are not currently in the sidebar.
2. Create a route-to-journey matrix. Each page must support a named journey, support setup/help, or be removed from discovery.
3. Consolidate duplicate event surfaces. Choose one authoritative event detail and one event-management workspace; link scanner, attendance, staff, budget, inventory, communications, and certificates from there as contextual tools.
4. Consolidate management routes around outcomes, not database tables. “Run event” is more understandable than separate links for event, registrations, sessions, passes, scans, and expenses.
5. Preserve deep links during route consolidation. Add redirects and test them before removing an old route.
6. Give each page a stable structure: breadcrumb, task-oriented title, short purpose, primary action, contextual secondary actions, content, and help/empty state.
7. Build role-specific dashboard start pages from the canonical journeys. A member sees their next event, pass, certificate status, and notifications; a lead sees pending approvals and active operational work.
8. Create a global command palette that only returns pages and actions the current role can use. It must surface event lookup, member lookup, create event, scan, and help.
9. Standardise list detail flows: a table/list provides search, filters, saved context, bulk actions only where safe, and an accessible detail route rather than putting all work in dialogs.
10. Standardise creation flows: introduce a draft, show completion state, save safely, and return the creator to a useful next step. A successful event draft should lead to setup/approval, not an inert toast.
11. Add explicit handoffs between journeys. Examples: approved application → member record + onboarding checklist; completed event → attendance reconciliation + certificate eligibility; approved expense → budget actuals + audit entry.
12. Replace vague statuses with a shared state vocabulary. Do not use “active,” “open,” “pending,” and “approved” interchangeably for the same lifecycle.
13. Add a persistent, role-aware help entry point with short “what happens next?” guidance rather than long product-tour overlays.
14. Test the new map with a visitor, member, event lead, finance lead, admin, and faculty coordinator. Record where each participant paused or could not predict the next action.
15. Remove navigation items and quick actions that remain disconnected after the journey review. Retiring a broken promise is better than retaining a confusing feature.

## Journey handoff contract

For every handoff, document the triggering state, owner, data written, notification, next visible screen, failure owner, and audit record. For example, an event registration should write the registration/pass state, tell the member where to find the pass, expose the attendee to scanning, and provide staff a capacity/waitlist result. A certificate workflow must clearly expose whether issuance is queued, generating, issued, failed, or revoked.

## Exit criteria

The information architecture is accepted when every visible destination has a named journey, role-relevant navigation is concise, all primary journeys can be described as a linear flow, and staff can find the next operational step from the event, applicant, finance, or member record without searching unrelated modules.
