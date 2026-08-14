# 06 — Connected Workflows and Background Jobs

## Purpose

This document is the antidote to fragmented functionality. Complete these workflows in order and do not mark downstream screens as ready until the upstream contract has passed.

## Workflow 1: applicant to member

1. A visitor reaches recruitment from the public navigation and sees the open/closed state, eligibility, privacy statement, and expected response time.
2. The application form validates required fields, saves a durable submission, prevents accidental duplicates, and provides a reference/status path.
3. The application enters a visible review queue with ownership, timestamps, and a lifecycle state.
4. A reviewer can view submitted data safely, add internal notes, request information, reject with a reviewed message, or schedule an interview.
5. Interview scheduling creates one source of truth, sends a notification, exposes reschedule/cancel state, and logs the decision.
6. Approval runs atomically: application status, user/member record, role/domain assignment, onboarding notification, and audit event either all succeed or clearly fail.
7. The new member’s first login shows onboarding, next event, profile completion, and support—not an empty administrative dashboard.
8. Test duplicate submissions, expired/closed cycles, reviewer permission denial, failed email/queue, repeated approval, and a rejected applicant’s privacy rights.

## Workflow 2: event to verified attendance to certificate

1. An authorised lead creates an event draft with title, visibility, dates/time zone, capacity, registration rules, staff, sessions, budget/inventory links, and checklist.
2. A separate approver reviews, rejects with a reason, or publishes. Publication creates correct public/member discoverability and communication options.
3. A qualified visitor/member registers. The system decides confirmed/waitlist state atomically against capacity and gives a pass or waitlist explanation.
4. A registered attendee finds the pass from both event detail and “My events”; staff can view the attendee list and capacity state.
5. At the venue, the QR scanner works online with an accessible manual code fallback, validates event/session eligibility, rejects duplicate scans, and reports clear feedback.
6. When offline, the scanner stores a signed/validated pending record locally, visibly counts it, synchronises exactly once upon reconnect, and displays per-record conflicts rather than silently discarding data.
7. Staff reconcile attendance, late/guest/walk-in records, session attendance, and exceptions before completing the event.
8. Certificate eligibility is calculated from documented attendance rules. A lead selects an approved template and issues only eligible recipients.
9. The issuance command records queued status, enqueues an idempotent job, shows progress/failure, persists verification data, sends an email if configured, and exposes public verification/revocation state.
10. Test capacity races, waitlist promotion, scanner retries, lost connectivity, repeated scan, eligibility edge cases, failed certificate rendering, duplicate queue jobs, revocation, and expired pass policy.

## Workflow 3: request to expense to budget actual

1. Finance creates a budget with owner, event/domain scope, currency, approved allocation, and period.
2. A requester submits a procurement or expense with category, amount, vendor, receipt/quote, business reason, and event link.
3. The system validates that the amount and approval status fit the remaining budget and the requester’s authority.
4. An authorised reviewer approves, returns, rejects, or marks paid with a reason; no amount or vendor change bypasses re-approval.
5. Approval updates budget actuals atomically and writes an audit event. The event workspace and finance dashboard show the same figures.
6. Any inventory acquisition records a traceable link to an inventory item/quantity rather than creating a separate untraceable record.
7. Test budget boundary races, cross-event access, receipt upload validation, changing a submitted request, duplicate approvals, and deletion/archival policy.

## Workflow 4: project/achievement to recognition

1. A member submits a project or achievement with required evidence, collaborators, visibility, and consent.
2. The relevant lead reviews it using a deterministic state model and leaves useful feedback.
3. Approval awards configured points only once, writes a point/audit log, updates the leaderboard, and notifies the member.
4. Public project visibility is a separate deliberate state; private evidence must never leak into a showcase.
5. Test duplicate award, rejected then revised submission, withdrawn entry, collaborator rights, image/file privacy, and leaderboard ties.

## Background-job operating steps

1. List every queue producer, job name, payload version, idempotency key, worker owner, retry policy, failure destination, and user-visible status.
2. Start the web process and worker as separate deployable services. A web deployment without workers is not feature complete for certificates, email, AI processing, reminders, or reports.
3. Validate environment configuration at startup. A missing optional provider must disable the associated workflow clearly instead of leaving it permanently pending.
4. Log job lifecycle events with correlation IDs; surface failed jobs to administrators with safe retry controls and no secret leakage.
5. Add dead-letter retention and alerting. Repeated failures need ownership before they become a queue backlog.
6. Use an outbox or equivalent transaction-safe enqueue strategy so database success and job creation cannot diverge.
7. Test worker restart, duplicate delivery, timeout, provider throttling, malformed payload, and manual retry before launch.

## Exit criteria

The workflows are accepted only when each numbered step is verified with role accounts and a disposable database, asynchronous stages are observable/retryable, and no user is left with an unexplained pending state.
