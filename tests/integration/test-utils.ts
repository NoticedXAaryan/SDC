import { db } from '@/lib/db';
import { user, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const TEST_ORG_ID = "test-org-123";

// We generate random IDs for parallel tests
export async function createTestUser(role: string = "member") {
  const id = `test-user-${Math.random().toString(36).substring(7)}`;
  await db.insert(user).values({
    id,
    name: `Test User ${role}`,
    email: `${id}@example.com`,
    role,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: TEST_ORG_ID,
  });

  return id;
}

export async function cleanupTestUser(id: string) {
  // Cascading deletes manually since schema doesn't have cascade for all
  await db.delete(auditLogs).where(eq(auditLogs.actorId, id));
  await db.delete(user).where(eq(user.id, id));
}

export function getMockSession(userId: string, role: string = "member", orgId: string = TEST_ORG_ID) {
  return {
    user: {
      id: userId,
      name: "Test User",
      email: "test@example.com",
      role,
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true
    },
    session: {
      id: `session-${userId}`,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "vitest"
    }
  } as any;
}
