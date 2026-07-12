# STC OS — Project Brief

## What This Is
STC OS is the internal operating system for the Student Developer Club (SDC) at Parul University (Goa campus). It manages the full lifecycle of a student tech club: members, events, attendance, certificates, finance, and recruitment.

## Who It's For
- **Club members**: Register for events, earn points, view certificates
- **Leads/Co-leads**: Create events, scan check-in QR codes, manage their domain
- **Finance leads**: Manage budgets, approve expenses, track inventory
- **Admins/Owners**: Full control — member management, audit logs, system config

## What's Out of Scope (for now)
- Face recognition check-in (deferred — too complex, low ROI)
- Cal.com calendar integration (deferred — not needed for MVP)
- Documenso signing (deferred — overkill for student certificates)
- Custom page deployment / GitHub stars cron (deferred — vanity features)
- Frontend redesign (deferred — backend stability first)

## Stack
- **Runtime**: Next.js 16 (App Router, standalone output)
- **Auth**: Better Auth 1.6.x (email/password + admin plugin)
- **Database**: Neon PostgreSQL, Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **QR**: HMAC-signed rotating QR passes (html5-qrcode for scanning)
- **Certificates**: pdfme (PDF generation)
- **Queue**: BullMQ + Redis (certificate generation)
- **Deploy**: Docker (multi-stage build), hosted on Dokploy / VPS
