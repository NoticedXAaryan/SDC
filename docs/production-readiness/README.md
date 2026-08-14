# SOC Production-Readiness Playbook

This 12-document playbook converts the existing feature-rich SOC platform into a cohesive, safely deployable club product. It is intentionally execution-oriented: each document defines a sequence of steps and objective exit criteria.

Start with the evidence-backed baseline, then work in order:

1. [Audit Baseline and Governance](01-audit-baseline-and-governance.md)
2. [Product Journeys and Information Architecture](02-product-journeys-and-information-architecture.md)
3. [UI System and Template Integration](03-ui-system-and-template-integration.md)
4. [Space Brand, Visual, and Motion System](04-space-brand-visual-and-motion-system.md)
5. [Backend Consolidation and Contracts](05-backend-consolidation-and-contracts.md)
6. [Connected Workflows and Background Jobs](06-connected-workflows-and-background-jobs.md)
7. [Data, Authentication, Security, and Privacy](07-data-auth-security-and-privacy.md)
8. [Quality Engineering and Test Environments](08-quality-engineering-and-test-environments.md)
9. [Accessibility, Responsive Behaviour, and Performance](09-accessibility-responsive-performance.md)
10. [Operations, Observability, and Deployment](10-operations-observability-and-deployment.md)
11. [Delivery Roadmap and Team Execution](11-delivery-roadmap-and-team-execution.md)
12. [Launch Acceptance and Go-Live Checklist](12-launch-acceptance.md)

The user-requested landing footer is protected by an explicit non-change rule in Documents 03 and 12. The plan uses the already-installed **Astryx Core** design system as the intended meaning of “Asterisk UI,” with documented, narrow Shadcn exceptions until migration is safe.

Existing `docs/SPECIFICATION.md`, `docs/ARCHITECTURE.md`, and `docs/EXECUTION_ROADMAP.md` remain valuable background references. This set supersedes none of them; it provides the concrete hardening, connection, and release procedure needed to take the project from feature inventory to real-world operation.

Companion coordination resources (not part of the 12 playbook chapters): [three paste-ready agent prompts](THREE_AGENT_PROMPTS.md) and the [shared coordination protocol](TEAM_COORDINATION.md).
