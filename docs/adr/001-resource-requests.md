# ADR 001: Resource Requests vs Extended Budgets
**Date:** 2026-07-12
**Decision:** Implement a distinct `resourceRequests` pipeline instead of extending the existing `budgets`/`expenses` system for zero-budget college requests.
**Rationale:** The club operates in an environment where we don't have direct liquid cash; we request resources/funds from the college. Trying to model this inside a standard income/expense ledger caused friction.
