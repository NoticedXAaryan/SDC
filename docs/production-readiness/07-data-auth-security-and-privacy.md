# 07 — Data, Authentication, Security, and Privacy

## Goal

Club software handles personal details, applications, attendance, finance records, evidence uploads, and often student contact information. Security is therefore a product requirement: a beautiful permission-hidden button cannot protect the club.

## Step-by-step hardening

1. Draw the data map: entity, fields, data owner, source, purpose, roles allowed to read/write, retention, export/delete behaviour, and external processor. Include user profiles, applications, attendance, certificates, finance, uploads, audit logs, notifications, face data, and analytics.
2. Formally adopt the role matrix and encode it in one policy module. List command permissions, not only page visibility. Include owner/admin/lead/domain lead/member/applicant/alumni/faculty differences.
3. Review Better Auth configuration against the current Next.js deployment: secure cookies, trusted origins, session duration/rotation, password reset, verification, OAuth callback URLs, and ban/delete behaviour.
4. Enforce authentication and authorisation at the service/DAL boundary. Add an automated negative test for every critical command using an unauthenticated user and the closest lower-privilege role.
5. Audit every API route for body/query/path validation, response redaction, rate limiting, error shaping, and role enforcement. Public endpoints must have purpose-specific throttling and abuse controls.
6. Verify the proxy/middleware protects all authenticated paths but does not replace endpoint-level authorization. Direct requests must be denied even if a page is hidden.
7. Apply database constraints for uniqueness, foreign keys, lifecycle integrity, and non-negative/capacity limits. Database constraints are the last defence against concurrent requests.
8. Make sensitive writes atomic. Role change, application approval, expense approval, certificate revoke, and account deletion require a transaction plus audit evidence.
9. Store secrets only in deployment secret management. Keep `.env.local` untracked, rotate any secret exposed in logs/history, and validate environment configuration on application and worker startup.
10. Set security headers deliberately: CSP with nonce/allow-list appropriate to Next.js, HSTS only after HTTPS verification, `frame-ancestors`, `nosniff`, referrer policy, permissions policy, and secure caching for private responses.
11. Validate uploads by file signature, size, dimensions where relevant, ownership, virus/malware scan policy, generated server-side name, private object storage policy, and signed download URLs. Never trust filename or client MIME type.
12. Add CSRF protections appropriate to the auth mechanism, replay resistance for scanner and webhook requests, secret verification for cron/webhooks, and idempotency for mutating requests.
13. Keep audit logs immutable to ordinary staff. Audit event detail must be useful while redacting passwords, tokens, raw application attachments, and unnecessarily sensitive PII.
14. Implement data-subject export/delete against a documented retention policy. Deletion must handle queues, files, certificates/legal records, and audit needs according to policy rather than silently leaving copies.
15. Retire or quarantine biometric attendance. The existing product specification says QR is canonical and biometrics are out of scope. Until a formal privacy assessment, explicit consent, retention policy, security review, and faculty approval exist, hide the face-enrolment/scanner paths from navigation and avoid collecting new descriptors.
16. Add dependency scanning, secret scanning, SAST, and a scheduled access review to CI/operations. Triage findings with dates and owners.
17. Conduct a pre-launch privacy review with the institution: privacy notice, terms, consent copy, data controller contact, minor/student policy, breach escalation, and retention approvals.

## Security test scenarios

- An applicant cannot read another applicant’s response or attachment.
- A member cannot approve events, spend, role changes, or certificates through a crafted request.
- A former/disabled user loses session access promptly.
- A scanner token/pass cannot be replayed across events or sessions.
- A revoked certificate displays revocation rather than a successful verification state.
- A malformed upload cannot execute, render as active content, or become public by guessed URL.
- A failed worker cannot expose provider tokens or raw PII in logs.
- An account export contains the user’s permitted data and account deletion follows the retention policy.

## Exit criteria

Security and privacy work is accepted when the policy matrix is tested at the API/service layer, sensitive data has an owner and retention rule, high-risk paths are transactionally audited, biometric conflict is resolved, and the club/institution has approved the privacy posture.
