| # | File:Line | Severity | Category | Description | Status |
|---|-----------|----------|----------|--------------|--------|
| 1 | `app/(dashboard)/events/[slug]/scanner/page.tsx:25` | Low | Correctness | `onScanSuccess` and `onScanFailure` accessed before declaration. | Fixed |
| 2 | `app/api/admin/forms/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 3 | `app/api/admin/forms/[id]/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 4 | `app/api/applications/[id]/status/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 5 | `app/api/events/[id]/invite/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 6 | `app/api/events/[id]/sessions/[sessionId]/attendance/route.ts` | Medium | Security | Missing `withApiHandler`, bypassing rate limit. | Fixed |
| 7 | `app/api/events/route.ts:86` | Medium | Correctness | `countResult` query breaks pagination. | Fixed |
| 8 | `app/api/achievements/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 9 | `app/api/achievements/scan/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 10 | `app/api/admin/audit/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 11 | `app/api/admin/members/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 12 | `app/api/admin/members/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 13 | `app/api/announcements/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 14 | `app/api/announcements/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 15 | `app/api/applications/export/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 16 | `app/api/applications/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 17 | `app/api/applications/[id]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 18 | `app/api/auth/[...all]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 19 | `app/api/certificates/blast/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 20 | `app/api/certificates/issue/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 21 | `app/api/certificates/issue-single/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 22 | `app/api/certificates/templates/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 23 | `app/api/certificates/templates/[id]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 24 | `app/api/certificates/[id]/revoke/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 25 | `app/api/compliance/delete/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 26 | `app/api/compliance/export/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 27 | `app/api/content/calendar/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 28 | `app/api/content/calendar/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 29 | `app/api/content/import/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 30 | `app/api/content/import/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 31 | `app/api/content/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 32 | `app/api/cron/github-stars/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 33 | `app/api/engagement/leaderboard/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 34 | `app/api/engagement/pending-approvals/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 35 | `app/api/engagement/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 36 | `app/api/events/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 37 | `app/api/events/[id]/approve/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 38 | `app/api/events/[id]/budget/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 39 | `app/api/events/[id]/certificates/issue-all/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 40 | `app/api/events/[id]/deregister/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 41 | `app/api/events/[id]/expenses/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 42 | `app/api/events/[id]/export/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 43 | `app/api/events/[id]/guest-register/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 44 | `app/api/events/[id]/guest-register/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 45 | `app/api/events/[id]/import/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 46 | `app/api/events/[id]/import/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 47 | `app/api/events/[id]/inventory/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 48 | `app/api/events/[id]/invite/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 49 | `app/api/events/[id]/invite-link/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 50 | `app/api/events/[id]/meetings/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 51 | `app/api/events/[id]/meetings/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 52 | `app/api/events/[id]/notify-colleagues/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 53 | `app/api/events/[id]/notify-colleagues/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 54 | `app/api/events/[id]/post-event/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 55 | `app/api/events/[id]/register/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 56 | `app/api/events/[id]/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 57 | `app/api/events/[id]/scan/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 58 | `app/api/events/[id]/sessions/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 59 | `app/api/events/[id]/walk-in/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 60 | `app/api/events/[id]/whatsapp-template/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 61 | `app/api/faculty/freeze/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 62 | `app/api/faculty/settings/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 63 | `app/api/finance/budgets/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 64 | `app/api/finance/expenses/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 65 | `app/api/finance/expenses/[id]/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 66 | `app/api/finance/incomes/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 67 | `app/api/health/route.ts` | Medium | Security | Missing auth checks (`requireSession`/`requireRole`). Need to verify if intentionally public. | Planned |
| 68 | `app/api/interviews/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 69 | `app/api/inventory/log/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 70 | `app/api/inventory/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 71 | `app/api/members/directory/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 72 | `app/api/notifications/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 73 | `app/api/onboarding/apply/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 74 | `app/api/onboarding/approve/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 75 | `app/api/procurement/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 76 | `app/api/projects/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 77 | `app/api/projects/[id]/approve/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 78 | `app/api/projects/[id]/approve/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 79 | `app/api/projects/[id]/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 80 | `app/api/research/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 81 | `app/api/research/[id]/approve/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 82 | `app/api/research/[id]/approve/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 83 | `app/api/scanner/batch/route.ts` | High | Performance | DB queries running inside a loop (potential N+1 pattern). Needs batching. | Planned |
| 84 | `app/api/scanner/check-in/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 85 | `app/api/sessions/[id]/check-in/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 86 | `app/api/sessions/[id]/scan/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 87 | `app/api/setup/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 88 | `app/api/upload/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 89 | `app/api/users/route.ts` | Nit | Maintainability | Reviewed, no issues found. | - |
| 90 | `app/api/users/[id]/role/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 91 | `app/api/vendors/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
| 92 | `app/api/vendors/[id]/rate/route.ts` | High | Correctness/Sec | Redundant `try/catch` swallows errors, bypassing global handler. | Planned |
