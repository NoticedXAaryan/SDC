# Active Context — 2026-08-07

## What just happened
1. **Fixed proxy auth bug:** Cookie names changed from `better-auth.session_token` → `sdc.session_token` to match the `cookiePrefix: "sdc"` in auth.ts
2. **Added 10 missing protected routes** to proxy (manage, settings, certificates, etc.)
3. **Added forgot-password/reset-password** to public paths
4. **Deleted Postiz stub service** — was returning fake data, no real integration
5. **Disabled auto-scheduled weekly report** — was emailing mock URLs to non-existent addresses
6. **Removed face-api.js** — unused dependency (no code imports it)
7. **Deleted 18 one-off scripts** from scripts/ (patches, tests, generators)
8. **Deleted all stale documentation** (19 files including 116KB scenario doc, old blueprints, old ADRs, old audits)
9. **Created ARCHITECTURE.md** — master document with DFDs, schema, API map, features
10. **Rewrote README.md** — correct stack versions, links to ARCHITECTURE.md

## Current state
- Build passes cleanly (`npx next build`)
- Dev server runs
- All documentation is fresh and accurate
- scripts/ has 7 operational scripts (migrate, seed, set-owner, clean, backup, init-form)

## Known issues to address in future sessions
- Weekly report worker needs real implementation
- Content pipeline social posting is disconnected (Postiz removed)
- Research papers and competitions have CRUD but no dedicated UI pages
- Offline scan sync needs end-to-end testing
- CSV import error handling needs review
