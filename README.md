# SDC OS (Student Developer Club Operating System)

SDC OS is a robust, professional-grade platform designed to manage student clubs, handle recruitment, events, members, and internal club administration.

## Features
- **Event Management**: Create and track events, attendance, and issue certificates.
- **Recruitment & Interiews**: Track applications, AI grading, and schedule interviews.
- **Role-based Access**: Custom roles (admin, leads, members) with granular permissions powered by Better Auth.
- **QR Scanning**: Native QR code scanning for fast event check-ins.
- **Inventory & Finance**: Manage club budgets, procurement requests, and physical inventory.

## Architecture Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui.
- **Backend**: Next.js API Routes, Drizzle ORM, PostgreSQL.
- **Background Jobs**: BullMQ and Redis (via background worker process).
- **Authentication**: Better Auth with custom role-based access control.

## Local Setup

### 1. Environment Variables
Copy the example environment file and fill in the required keys:
```bash
cp .env.example .env
```
Ensure you have a PostgreSQL database URL and Redis URL set up.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npm run db:migrate
```

### 4. Running Locally

The easiest way to run the entire stack (including Postgres, Redis, the Web app, and the Background Worker) is using Docker Compose:

```bash
docker-compose up --build
```
This will start:
- PostgreSQL Database (if configured in docker-compose.yml)
- Redis Cache
- Next.js Web App (http://localhost:3000)
- Background Worker Process (processes emails, certificates, grading, etc.)

Alternatively, to run natively:
```bash
# Terminal 1: Web App
npm run dev

# Terminal 2: Worker
npm run worker
```

## Security & Rate Limiting
- All state-changing API routes are rate-limited via Redis.
- Better Auth handles session hijacking prevention, secure CSRF tokens, and role-based guards.
- Custom `withApiHandler` enforces structured error responses across all API endpoints.

## Contributing
Please refer to the `docs/ai/` directory for architectural decisions, research notes, and past implementations before making major changes.
