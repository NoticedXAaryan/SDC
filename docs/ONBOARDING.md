# STC OS Onboarding

Welcome! This document will help you get STC OS up and running locally, and explain how our production access is structured.

## Local Dev Setup
1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and populate the values.
4. Setup a local Postgres DB and run `npx tsx scripts/force-db.ts` to sync schema.
5. Run `npm run dev`.

## Production Access & Bitwarden Vault
All production secrets, domain registrar credentials, Azure VM access, Cloudflare, Resend, and OpenRouter API keys are stored in our shared **Bitwarden Vault** (as part of our bus-factor reduction strategy P9-04).
When the Tech Lead steps down, they must rotate passwords and share access with the next Tech Lead + Faculty Coordinator. Never store production secrets in your personal password manager alone.

## Deployment
Check our deployment runbook in the Azure VM / Dokploy instance. Ensure `env.ts` validations pass before scaling.
