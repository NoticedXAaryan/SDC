# SDC: completion plan and current evidence

Updated: 8 September 2026. This is the working product plan, not a release sign-off.

## Product direction

SDC should feel like one club: discover it, attend events, apply for membership, collaborate, and help run it. Keep the current footer. Repair the existing application in place. Use real club content, one visual system, and purposeful motion. Existing core operations remain in scope; new decorative features do not.

The latest user request supersedes earlier username and enrollment requirements. Signup must no longer issue usernames. Membership applicants propose a username; approval assigns it permanently. A CV becomes required. College verification and face setup are added to enrollment. These changes are PLANNED, not yet implemented.

## What exists today

| Area | Actual state |
| --- | --- |
| Accounts | Local signup, email verification/resend, password recovery, first-login guidance and role badges have passed browser checks. Signup currently still offers a username and settings still allows controlled changes; both conflict with the latest policy and must change. |
| Membership | Guided intro, one question per screen, back/next, saved drafts, review/edit, private PDF upload, submission, reviewer answer page, approval and one-time congratulations are implemented. Desktop/mobile journeys passed. Current default has 14 questions and an optional CV; the revised shorter questionnaire and mandatory CV are still to do. |
| Local form activation | The exact old two-question browser fixture was retired without deleting its records. The default 14-question membership form is now active locally. |
| UI | Shared palette/control improvements, settings, notifications, membership surfaces, bottom navigation, themed search and branded loading are implemented. Mobile search positioning was repaired and covered by a regression test. Many older pages still need individual visual/accessibility review. |
| Landing | Existing section-based page and admired footer exist. The new creative direction and interactions are not implemented. |
| Events | Listing, filters, registration, passes and some attendance logic exist. An empty page does not establish that no implementation exists. Inspect publication, dates, visibility and data loading; then prove the whole journey. |
| Communities | No working forum routes/thread/reply implementation was found in the inspected source. Treat this as a feature to build, not simply a switch to enable. |
| Face attendance | Camera capture and face descriptor enrollment exist. The current API permits existing members, not applicants. Quality checks do not prove liveness or reliable event admission. Full venue verification remains unverified. |
| Admin/operations | A dedicated local administrator was created and its login verified through the admin overview, member management and certificate pages. Other operational modules still need complete journey testing. New applications can enter human interview scheduling without waiting for AI grading. |
| Delivery | Recovery work is tracked on the codex/project-recovery branch and draft PR #1. Local credentials and test fixtures remain ignored. No deployment or release sign-off. |

## Verification record

- Before the questionnaire extension: production build passed; combined desktop/mobile account and membership suite passed 16 tests; database integration passed 100 tests.
- Questionnaire extension: four desktop/mobile membership/bot checks passed, including navigation, draft persistence, private CV attachment, review editing, submission and approval.
- Most recent completed unit run: 124 passing tests, including the default-questionnaire assertion.
- Most recent completed integration run: all 105 tests passed across 18 files, including immutable submissions, safe retries, draft validation and résumé ownership.
- Combined browser regression: all 16 desktop/mobile account, authentication and membership checks passed. The additional mobile search bounds regression also passed within the complete account journey.
- Typecheck, quiet lint and the production build passed after the navigation and notification changes.
- Migrations 0023 and 0024 were applied locally. 0024 stores one private PDF per account/recruitment round, capped at 2 MB, outside the public upload store.
- The earlier usage-limit block cleared. Local questionnaire activation, admin provisioning and the pending integration rerun completed successfully.

## A glimpse of the finished experience

A visitor sees a distinctive, fast club homepage: a brief SDC identity animation, a clear introduction, an actual upcoming event, student work, practical membership information, and the existing footer.

After signup, the participant's home says what they can do now: explore an event, view a pass, or enroll. It clearly labels them Participant. Membership enrollment opens a focused screen without workspace clutter. A short, honest application leads to a visible Under Review state.

After approval, the account receives its permanent member username and a Member badge, with “Congratulations! You are a member now.” The home now points to their club discussions, events and assigned work. Leaders see their team responsibilities and approval queues. Admins can manage membership and run complete event/certificate journeys.

On a phone, five destinations stay within thumb reach: Home, Events, Search, Community, More. Notifications remain available from the header; participant access to member-only community content explains membership rather than leaking identities. Desktop uses a consistent sidebar with Notifications as its own destination.

## Decisions and acceptance criteria

### 1. Shared design, navigation and loading

- Charcoal/soft neutral surfaces and a controlled club accent, with a fully supported light theme. Consistent typography, spacing, radii, buttons, fields, dialogs, tables and status messages.
- Completed: removed the Club website sidebar link, moved Notifications outside Account, repaired inbox spacing and added mark-as-read controls with failure handling.
- Replace mobile top-tab navigation with bottom navigation, safe-area spacing, visible labels, active state and a dedicated Search action. More contains profile, membership status and role-specific tools.
- Search uses the current theme and a restrained overlay. Clear sections distinguish navigation from actual event/discussion results. Search only data the user may access; first deliver accurate navigation, then add real indexed content.
- Landing: a brief branded opening animation, never a fake countdown or a mandatory waiting screen. Dashboard: skeletons matching the eventual layout and a small branded loading cue, with real retry/error handling.
- Reduced-motion alternatives, keyboard focus, screen-reader feedback, contrast, touch targets and mobile keyboard behavior are part of completion.

### 2. Landing page

- Preserve the footer's design and visual character.
- Rebuild the hero around the student club: a clear statement, Explore events and Join the club actions, and real student work.
- Add a live upcoming-event card, small interactive project previews and a simple membership explainer. Show counts, countdowns and announcements only when supported by actual published data.
- Compose responsive layouts deliberately for phones and desktops. Avoid duplicated carousels, noisy animation and placeholder claims.
- Inspect actual rendered output in both themes where applicable, and verify loading, keyboard access and performance.

### 3. Enrollment, college verification and permanent usernames

Target journey:
Participant -> Enroll as a Member -> Welcome/time estimate -> College verification if needed -> Short application -> Required CV -> Username request -> Face setup -> Review -> Submit -> Under Review -> Human decision -> Member.

- Intro: a focused, spacious screen with “Welcome to the journey,” an estimated completion time based on the actual question count, and a clear start button.
- College verification: skip repeated email verification only when the signup email is already verified AND belongs to an approved college domain. Otherwise collect college email, enrollment number and institution details; verify possession through an expiring code/link. An email suffix alone is not proof. Admin review handles exceptions and verifies enrollment details; do not claim university database verification without an integration.
- Confirmed student email domain: `goa.paruluniversity.ac.in`. Match the exact normalized domain, not arbitrary suffixes or lookalikes; keep the allowlist configurable. Verify the actual email address before skipping the check.
- Questions: profile/course, preferred contribution, one project or learning example, motivation, teamwork and realistic availability. Include one optional playful question, such as “Your team is stuck at 11 pm: debug, sketch, organize, or bring snacks?” It should not affect acceptance.
- One screen per question, concise help, back/next, required-field feedback, saved drafts, final review and accessible edit controls.
- Require a PDF CV, with the current 2 MB limit and actionable upload errors. Explain accepted formats before the upload step. Private access remains owner plus authorized reviewers after submission.
- Signup has no username field. Ask for a proposed handle during enrollment, validate format/reserved names, and assign it atomically only when approved. If another applicant receives it first, ask for a replacement without losing the application.
- Approved usernames cannot be changed through settings, alternate APIs or admin profile edits. Existing legitimate member handles are preserved and locked. Existing participant handles need a reviewed data migration; do not silently erase them.
- Under Review is visible on the dashboard and membership destination. Desktop hover AND keyboard focus can show a short popover; mobile tap opens status details. Do not rely on hover for essential information.
- Approval assigns membership and username together, sends the welcome notification and shows the exact requested congratulations message. Define requests for more information and rejection clearly.
- Direct admin approval must still finish required member setup; an account must not display a misleading “all set” state while required data is missing.

### 4. Face setup and event attendance

- Add guided face setup to the normal member-registration journey, with a clear explanation, explicit consent, camera preview, quality feedback and retry.
- Camera refusal, inaccessible hardware or failed capture must have an admin-assisted path. Recommend retaining a non-biometric membership exception rather than permanently locking students out.
- Keep a conventional QR event pass. Face and QR must lead to the same authorized, duplicate-safe attendance record.
- Verify event registration/eligibility and event scope on the server. A face match alone is not a valid event ticket.
- Use an event-scoped or claimed-identity verification flow, not indiscriminate crowd identification.
- Test liveness/spoof resistance, matching accuracy, poor lighting, permission denial and fallback at an actual venue before enabling face-based admission.
- Restrict biometric access, protect stored templates, define deletion and retention, and avoid exposing descriptors in general account APIs.

### 5. Events and certificates

- Give Explore Events useful Upcoming, Past and My registrations views, readable cards, search/filter controls and clear date/venue/capacity information.
- Trace why the current page appears empty: published status, date filters, visibility, missing records or fetch failures. Use clearly labelled local demo events for testing; do not invent public activity.
- Complete create -> approve -> publish -> register/waitlist -> pass -> cancel/promote -> QR/face attendance -> certificate.
- Fix public/private event visibility and alternate registration paths. Keep event-scoped staff permissions.
- Certificates must use verified attendance and eligibility, support preview/issuance/download, avoid duplicate issuance and provide a public verification page with minimum necessary data.

### 6. Community forums

- Start with useful spaces: Announcements, Questions and Help, Projects and Feedback, and Club Lounge.
- Deliver thread creation, replies, simple reactions, search, pinned posts, following and notifications. Keep chronological discussion readable.
- Approved members can participate; staff can moderate. Public visitors cannot see member usernames. Do not ship a half-working real-time chat clone alongside the forum.
- Add report, lock, hide/remove and moderation audit actions, plus rate limits and safe text rendering.
- Open actual categories and write clearly authored welcome/guidance posts. Never fabricate member conversations to make the forum look active.

### 7. Role workspaces and remaining core modules

- Participant: events, registrations, passes, certificates, enrollment and application status.
- Member: participant tools plus member profile, forums, club opportunities and assigned work.
- Co-lead: their team's tasks, event preparation and permitted recruitment/interview actions.
- Lead: team coordination, event/recruitment decisions and certificate workflows within policy.
- Admin: membership approval, role management, configuration, audits, events and operational oversight.
- Verify both navigation and direct API permissions for each role. A hidden button is not an access control.
- Repair existing tasks, forms, projects, achievements, content, expenses, procurement and inventory as connected workflows. Each screen needs an owner, a useful action and a clear next step.

### 8. Admin testing and release readiness

- Completed locally: provisioned a separate test administrator and verified its login and admin/member/certificate page access. Generated credentials are in the ignored .recovery/admin-access.json file, linked directly to the user. No existing account password was reset.
- Prepare labelled local test records for membership review, event registration, attendance and certificates. Add separate member and team-role fixtures to test permissions.
- Verify real email workers, queue retries, bot-protection configuration, file delivery and error handling.
- Production Turnstile/email/storage configuration, staging, backups, restore and rollback remain required.
- Push a reviewed checkpoint, run CI and retain release gates until complete journeys pass. No production deployment is implied by a successful build.

## Work order

1. Close the current checkpoint: fix/re-run remaining checks, activate the correct local form, provision admin testing access, and safely commit/push existing work.
2. Establish the final visual direction and shared shell: landing preview with retained footer, bottom navigation, search, notifications and loading.
3. Finish the revised membership contract end to end: college verification, shorter questions, required CV, permanent usernames, status and approval.
4. Complete event discovery, organizer flow, QR attendance and certificates; validate face enrollment and venue verification separately before enabling it.
5. Open the member forums and connect notifications, profiles and moderation.
6. Finish each remaining role/operations journey, apply the same polish, run staging checks and release.

For every step, “done” means it works through the interface on desktop and mobile, stores the right data, enforces permissions, handles failure, and gives the user a clear next action. No percentage-complete estimate or release date is claimed until the remaining workflows have been verified.

## Local development

Docker provides PostgreSQL on port 55432, Redis on 56379, and Mailpit on 58025. The app uses sdc_dev; integration tests reset only sdc_test. Local configuration, credentials, screenshots and recovery fixtures stay out of Git. The older remote Neon database is not required for this recovery environment.
