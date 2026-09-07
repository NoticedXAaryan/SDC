import { and, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, auditLogs } from "@/lib/db/schema";
import { normalizeUsername, usernameError } from "@/lib/username-policy";
import { ValidationError } from "@/lib/api-wrapper";

/** Both legacy endpoints share a transaction; availability is only a preflight. */
export async function saveUsername(userId: string, value: unknown, initialOnly = false) {
  const error = usernameError(value);
  if (error) throw new ValidationError(error);
  const username = normalizeUsername(value as string);
  try {
    return await db.transaction(async tx => {
      const [current] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
      if (!current) throw new ValidationError("Account not found.");
      if (current.username === username) return username;
      if (initialOnly && current.username) throw new ValidationError("Your username is already set. Change it in Settings.");
      if (current.username) {
        const remaining = current.handleChangedAt
          ? Math.ceil(30 - (Date.now() - current.handleChangedAt.getTime()) / 86_400_000) : 0;
        if (remaining > 0) throw new ValidationError(`You can change your username again in ${remaining} days.`);
        if ((current.handleChangeCount || 0) >= 3) throw new ValidationError("You have used all three username changes. Contact a club admin for help.");
      }
      const [taken] = await tx.select({ id: user.id }).from(user).where(and(ne(user.id, userId), or(eq(user.usernameLower, username), sql`lower(trim(${user.username})) = ${username}`))).limit(1);
      if (taken) throw new ValidationError("This username is taken. Choose another.");
      await tx.update(user).set({ username, usernameLower: username, handleChangedAt: new Date(),
        handleChangeCount: (current.handleChangeCount || 0) + (current.username ? 1 : 0), updatedAt: new Date(),
      }).where(eq(user.id, userId));
      await tx.insert(auditLogs).values({ actorId: userId, action: current.username ? "CHANGE_USERNAME" : "RESERVE_USERNAME", entity: "user", entityId: userId, details: "Username updated" });
      return username;
    });
  } catch (error) {
    const pgError = error as { code?: string; cause?: { code?: string } };
    if (pgError.code === "23505" || pgError.cause?.code === "23505") throw new ValidationError("This username was just taken. Choose another.");
    throw error;
  }
}
