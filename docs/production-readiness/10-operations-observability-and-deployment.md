# 10 — Operations, Observability, and Deployment

## Deployment model

Deploy the web application, worker, PostgreSQL, and Redis as independently health-checked services. The existing application already contains readiness/liveness routes and worker/queue concepts; the production plan must prove they are configured, monitored, and recoverable together.

## Step-by-step operational readiness

1. Create separate development, test, staging, and production environments with unique databases, Redis instances/namespaces, storage buckets, credentials, domains, analytics projects, and error-monitoring projects.
2. Use infrastructure configuration as code or a controlled checklist. Record service versions, regions, backup configuration, network rules, domains, and owners.
3. Validate all required environment variables at startup for both web and worker. Optional integrations must declare `disabled` capability state visibly to administrators.
4. Run migrations as a deliberate release phase. Back up first, verify schema compatibility, run forward-only migration, smoke test, and prepare a forward-fix—not an unsafe schema rollback—for failures.
5. Configure `/api/health` for liveness and `/api/ready` for dependency readiness. Readiness should include only dependencies required for the served capability and return safe diagnostics.
6. Ensure worker health is separately monitored: process alive, queue connection, queue depth, oldest waiting job, failure count, retry count, and last successful job per queue.
7. Establish structured logs with timestamp, environment, service, release SHA, request/job correlation ID, actor ID where appropriate, and redaction. Never log secrets, passwords, full payment-like documents, or raw biometric data.
8. Configure Sentry/error monitoring for web and worker with release tagging, source maps, alert routing, PII scrubbing, and an owner for new errors.
9. Configure analytics only after consent/privacy review. Track outcome metrics—not sensitive content—including registration conversion, no-show rate, approval cycle time, certificate success/failure, failed scanner sync, and task completion.
10. Define SLOs and alerts: availability, error rate, p95 latency, queue delay, DB connection failures, backup failure, certificate failures, and authentication anomalies. Alerts must have thresholds and response owners.
11. Test backup restoration into an isolated environment. A backup is not a recovery strategy until a restoration has been timed and verified.
12. Create runbooks for database incident, Redis outage, queue backlog, email-provider failure, bad deployment, account compromise, data deletion request, event-day scanner outage, and certificate failure.
13. Practise a staging deployment, event-day scanner rehearsal, worker restart, and rollback/forward-fix rehearsal before launch.
14. Enable immutable release identification in the UI/admin health page so staff can report which version they are using.
15. Use canary or staged rollout for changes to auth, migrations, event registration, scanning, and certificate workflow. Monitor before broad enablement.
16. Make a post-deploy smoke test mandatory: public landing and footer, login, member dashboard, event registration, scanner/manual code, admin action, health/readiness, worker job, certificate verification, and error monitoring event.

## Exit criteria

Operations are accepted when all services have ownership and health checks, worker/queue status is observable, backups have been restored successfully, alert/runbook coverage exists, and staging proves the deployment and smoke-test sequence.
