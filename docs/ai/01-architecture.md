# Architecture Reference

The master architecture document lives at `docs/ARCHITECTURE.md` in the project root.

It contains:
- System overview and high-level architecture diagram
- Complete technology stack with versions and purposes
- 11 Data Flow Diagrams covering every major feature
- Full database schema map (30+ tables)
- Complete API route inventory (~95 endpoints)
- Role hierarchy and permission matrix
- Feature registry with working/partial/stub status
- Infrastructure, deployment, and security documentation

## Key patterns

- **Layered arch:** Route → API handler → DAL → DB (business logic lives in DAL, not route handlers)
- **Auth:** Better Auth with `cookiePrefix: "sdc"`, 14-role RBAC via admin plugin
- **API convention:** `withApiHandler` wrapper for validation, auth, audit, error handling
- **Background jobs:** BullMQ queues → Redis → Worker process (separate from web)
- **UI:** Astryx Design shell + Radix primitives + Tailwind CSS 4
- **Schema:** Drizzle ORM with `pgTable`, `pgEnum`, and explicit relations
- **IDs:** `crypto.randomUUID()` for all primary keys
