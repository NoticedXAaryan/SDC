# Student Developer Club

The Student Developer Club platform — our club's website and internal tools for managing members, events, attendance, certificates, recruitment, finance, inventory, projects, and communications from one system.

## Quick Start

### Prerequisites
- Node.js ≥ 22
- PostgreSQL
- Redis

### Setup
```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, REDIS_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, RESEND_API_KEY, ADMIN_EMAIL

# 3. Run migrations
npm run db:migrate

# 4. Start development
npm run dev        # Terminal 1: Web app (http://localhost:3000)
npm run worker     # Terminal 2: Background workers
```

Or use Docker Compose:
```bash
docker-compose up --build
```

## Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Astryx UI |
| **Backend** | Next.js API Routes, Drizzle ORM, PostgreSQL |
| **Auth** | Better Auth with 14-role RBAC |
| **Background Jobs** | BullMQ + Redis (email, certificates, AI grading, reminders) |
| **Email** | Resend + React Email |
| **Monitoring** | Sentry (errors), PostHog (analytics) |
| **Deployment** | Docker (standalone), Docker Compose |

## Documentation

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the complete system documentation including:
- Data Flow Diagrams for all major features
- Full database schema map (30+ tables)
- Complete API route inventory (~95 endpoints)
- Role hierarchy and permission matrix
- Feature registry with status tracking
- Infrastructure and deployment guide

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run worker` | Start background workers |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed development data |
| `npm run db:set-owner` | Set system owner by email |
| `npm run db:clean` | Clean test data |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |

## Security

- Route protection via `proxy.ts` + DAL authorization
- 14-role RBAC enforced at the data access layer
- Redis-backed rate limiting on all mutating routes
- Zod schema validation on all API inputs
- Security headers (HSTS, X-Frame-Options: DENY, CSP)
- Cloudflare Turnstile on registration
- Full audit trail in `audit_logs` table
- GDPR compliance (data export + deletion)
