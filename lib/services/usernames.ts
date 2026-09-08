import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, auditLogs, applications } from "@/lib/db/schema";
import { normalizeUsername, usernameError } from "@/lib/username-policy";
import { ValidationError, AuthorizationError } from "@/lib/api-wrapper";
import { isClubMember } from "@/lib/membership";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function assertUsernameAvailable(tx: Transaction, userId: string, value: unknown) {
  const error = usernameError(value);
  if (error) throw new ValidationError(error);
  const handle = normalizeUsername(value as string);
  // Serialize competing approvals for the same candidate, including different users.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${handle}))`);
  const [taken] = await tx.select({ id: user.id }).from(user).where(and(ne(user.id, userId), or(eq(user.usernameLower, handle), sql`lower(trim(${user.username})) = ${handle}`))).limit(1);
  if (taken) throw new ValidationError("This username is taken. Ask the applicant to request another before approval.");
  return handle;
}
export async function approveRequestedUsername(tx: Transaction, userId: string) {
  const [current] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
  if (!current || current.username || !current.requestedUsername) return;
  const username = await assertUsernameAvailable(tx, userId, current.requestedUsername);
  await tx.update(user).set({ username, usernameLower: username, requestedUsername: null, handleChangedAt: new Date(), updatedAt: new Date() }).where(eq(user.id, userId));
}
/** Existing members without a handle may request one. Participant requests belong to enrollment. */
export async function saveUsername(userId: string, value: unknown, _initialOnly = false) {
  const error = usernameError(value);
  if (error) throw new ValidationError(error);
  return db.transaction(async tx => {
    const [current] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
    if (!current) throw new ValidationError("Account not found.");
    if (current.username) throw new ValidationError("Your approved username is permanent and cannot be changed.");
    const [application] = await tx.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt)).limit(1).for("update");
    if (!isClubMember(current.role) && (!application || ["accepted", "rejected"].includes(application.status || ""))) throw new AuthorizationError("Request a username through membership enrollment.");
    const requestedUsername = await assertUsernameAvailable(tx, userId, value);
    await tx.update(user).set({ requestedUsername, updatedAt: new Date() }).where(eq(user.id, userId));
    if (application && !["accepted", "rejected"].includes(application.status || "")) await tx.update(applications).set({ answers: { ...(application.answers as Record<string, unknown> || {}), requestedUsername }, updatedAt: new Date() }).where(eq(applications.id, application.id));
    await tx.insert(auditLogs).values({ actorId: userId, action: "REQUEST_USERNAME", entity: "user", entityId: userId, details: "Member requested a username for admin approval" });
    return requestedUsername;
  });
}
