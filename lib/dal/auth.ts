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

export async function requireSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session) {
    redirect("/login");
  }
  
  return session;
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
