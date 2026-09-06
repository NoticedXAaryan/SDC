# SDC recovery status

Updated: 7 September 2026. This is a development checkpoint, not a release sign-off.

## What the project is

One place for students to find events, register, receive passes and certificates, and apply to the club team. Organizers use the same platform to plan events, manage people, assign work, and track club resources.

The existing Next.js, React and PostgreSQL application is being repaired in place. The source present at takeover was preserved locally before recovery changes. A separate development branch preserves the release branch.

## Verified in this recovery pass

| Check | Evidence | What it establishes |
| --- | --- | --- |
| TypeScript | `npm run typecheck` passed | Current source types agree. |
| Lint | `npm run lint -- --quiet` passed | No lint errors in the checked source. |
| Unit tests | 26 files, 120 tests passed | Tested rules and validators behave as asserted. |
| Database integration | 16 files, 94 tests passed | Tested service/API workflows work against migrated local PostgreSQL. Email workers and Redis are mocked in this suite. |
| Production build | `npm run build` passed | The application can be compiled and packaged. This does not prove deployment or every page works. |
| Browser checks | Ten authentication/redirect checks and two complete desktop/mobile account journeys passed. | Signup, verification, resend, invalid-link recovery, onboarding, mobile navigation, password reset and signing in with the new password work against real local services. |

There is no reliable percentage-complete estimate. A feature is not complete merely because its page exists or a document describes it.

## Repairs now implemented

- Public signup creates an outside attendee account; it cannot silently grant ownership or club membership.
- Signup, verification, resend, invalid-link recovery, onboarding and dashboard reminders are connected.
- Unconfigured Google sign-in is hidden. Local development has an email inbox so verification and password recovery can be tested properly.
- Desktop navigation, mobile navigation and search share one list of destinations.
- The student home page explains the next step and shows real registrations, passes, certificates and application status.
- Pass validity is tied to the event rather than expiring seconds after delivery.
- Registration counts include attendees already checked in.
- Cancellation and automatic waitlist promotion use the same event lock and transaction as registration. Tests cover concurrent requests, repeated cancellation, capacity, verification and internal-event restrictions.
- Repeated scans report existing attendance. Scanner access is checked against the event.
- Recruitment tests now exercise actual API transitions instead of directly writing an accepted status and then claiming the workflow worked.
- Integration tests explicitly target a disposable test database and fail when it is unavailable.

## What remains before release

| Area | Required outcome |
| --- | --- |
| Accounts | Expired-session behavior, profile editing and production email delivery. |
| Events | Browser proof from draft to approval, registration, waitlist, cancellation, scanning and certificates; consistent public/private access and all registration entry points. |
| Recruitment | Connect the applicant screen to the active application form and cycle; complete draft, submission, reviewer, interview and membership journeys. |
| Role workspaces | Confirm the admin, lead, co-lead and member each see the correct work and permissions, including direct API/URL attempts. |
| Club operations | Complete browser journeys for tasks, forms, communications, expenses, procurement, inventory, projects, content and achievements. Check their handoffs to people and events. |
| Design and accessibility | Apply one coherent layout and component system across remaining screens. Verify keyboard access, focus, contrast, mobile layout, empty states, errors and reduced motion. |
| Operations | Run real workers; verify retries, email and file delivery; rehearse migrations, backups, restore, monitoring and rollback in staging. |

Known follow-up concerns include event visibility checks on public details, alternate registration handlers, walk-in scope/membership, recruitment's active-form wiring, and worker delivery. They remain open until individually repaired and verified.

## Straightforward completion order

1. Finish the attendee journey: create an account → verify → discover an event → register → receive pass → attend → receive certificate.
2. Finish the organizer journey: draft → review → publish → assign work → run event → follow up. Give co-leads useful preparation tools and clear approval handoffs.
3. Finish recruitment and the existing supporting operations. Keep each feature connected to an actual person, event, task or request.
4. Apply the visual system across those working journeys, then run desktop, mobile and accessibility checks.
5. Release only after staging passes, real delivery works, and backup/rollback has been exercised.

For each journey, completion means the user can finish it through the interface, the saved data is correct, permissions hold, retries are safe, and failures explain how to recover.

## Local development

`npm run dev:services` starts PostgreSQL, Redis and Mailpit with ports bound to this machine.

- Application: `http://localhost:3000` after `npm run dev`.
- Development database: `sdc_dev`, PostgreSQL port `55432`.
- Disposable integration database: `sdc_test`, same PostgreSQL service.
- Redis: port `56379`.
- Captured test email: `http://127.0.0.1:58025`.
- Set `DEV_MAILBOX_URL=http://127.0.0.1:58025` in local configuration. This transport is ignored in production.
- Local configuration and recovery archives are excluded from Git.
- `npm run test:integration` resets only the explicitly named test database; it does not reset the development database.

The older remote Neon database is not needed for this recovery environment. Production email, hosting and worker readiness are separate release checks.
