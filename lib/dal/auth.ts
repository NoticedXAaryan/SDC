import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { user } from "../db/schema";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Extended session user type that includes our custom `role` column.
 * Better Auth's default session type doesn't include custom fields
 * we added to the user table, so we extend it here.
 */
export type SessionUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role?: string | null;
};

export async function requireSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session) {
    redirect("/login");
  }
  
  // Better Auth returns the full user row (including our custom `role` column),
  // but its TypeScript type doesn't reflect custom schema fields.
  return session as typeof session & { user: SessionUser };
}

export async function requireRole(roles: string[]) {
  const session = await requireSession();
  
  const currentUser = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  
  if (!currentUser || currentUser.length === 0 || !currentUser[0].role) {
    throw new AuthorizationError();
  }
  
  if (!roles.includes(currentUser[0].role)) {
    throw new AuthorizationError();
  }
  
  return { session, user: currentUser[0] };
}
