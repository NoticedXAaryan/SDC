import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeIdentities, user } from "@/lib/db/schema";
import { collegeDetailsSchema, isCollegeEmail } from "@/lib/college-policy";
import { ValidationError } from "@/lib/api-wrapper";
import { Mailer } from "@/lib/services/mailer";

function digest(userId: string, email: string, code: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Authentication secret is required.");
  return crypto.createHmac("sha256", secret).update(`${userId}:${email}:${code}`).digest("hex");
}
export async function collegeStatus(userId: string) {
  const [account] = await db.select({ email: user.email, verified: user.emailVerified }).from(user).where(eq(user.id, userId)).limit(1);
  const [identity] = await db.select({ email: collegeIdentities.collegeEmail, verified: collegeIdentities.verifiedAt, pendingEmail: collegeIdentities.pendingEmail }).from(collegeIdentities).where(eq(collegeIdentities.userId, userId)).limit(1);
  const primaryVerified = !!account?.verified && isCollegeEmail(account.email);
  return { verified: !!identity?.verified || primaryVerified, email: identity?.email || (primaryVerified ? account!.email : null), pendingEmail: identity?.pendingEmail || null };
}
export async function requireCollegeVerification(userId: string) {
  // Claim the verified primary email too: one college identity cannot enroll two accounts.
  try {
    await db.transaction(async tx => {
      const [account] = await tx.select().from(user).where(eq(user.id, userId)).for("update");
      const [identity] = await tx.select().from(collegeIdentities).where(eq(collegeIdentities.userId, userId)).limit(1);
      if (identity?.verifiedAt && identity.collegeEmail) return;
      if (!account?.emailVerified || !isCollegeEmail(account.email)) throw new ValidationError("Verify your college email before submitting your application.");
      await tx.insert(collegeIdentities).values({ userId, collegeEmail: account.email.toLowerCase(), verifiedAt: new Date() }).onConflictDoUpdate({ target: collegeIdentities.userId, set: { collegeEmail: account.email.toLowerCase(), verifiedAt: new Date(), codeHash: null, pendingEmail: null } });
    });
  } catch (error) { throwCollegeError(error); }
}
function throwCollegeError(error: unknown): never {
  const code = error as { code?: string; cause?: { code?: string } };
  if (code.code === "23505" || code.cause?.code === "23505") throw new ValidationError("This college address cannot be linked to your account. Contact a club admin for help.");
  throw error;
}
export async function sendCollegeCode(userId: string, input: unknown) {
  const details = collegeDetailsSchema.parse(input);
  const code = crypto.randomInt(100000, 1000000).toString();
  const hash = digest(userId, details.email, code);
  await db.transaction(async tx => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const [identity] = await tx.select().from(collegeIdentities).where(eq(collegeIdentities.userId, userId)).limit(1);
    if (identity?.verifiedAt) throw new ValidationError("Your college email is already verified.");
    const now = Date.now();
    if (identity?.lastSentAt && now - identity.lastSentAt.getTime() < 60_000) throw new ValidationError("Wait one minute before requesting another code.");
    const sameWindow = identity?.sendWindowAt && now - identity.sendWindowAt.getTime() < 3_600_000;
    if (sameWindow && identity.sendCount >= 5) throw new ValidationError("You've requested five codes. Try again in an hour or contact a club admin.");
    const values = { pendingEmail: details.email, enrollmentNumber: details.enrollmentNumber, collegeName: details.collegeName, codeHash: hash, expiresAt: new Date(now + 600_000), attempts: 0, lastSentAt: new Date(now), sendWindowAt: sameWindow ? identity.sendWindowAt : new Date(now), sendCount: sameWindow ? identity.sendCount + 1 : 1 };
    await tx.insert(collegeIdentities).values({ userId, ...values }).onConflictDoUpdate({ target: collegeIdentities.userId, set: values });
  });
  await Mailer.sendEmail({ to: details.email, subject: "Verify your college email — SDC", html: `<h2>Verify your college email</h2><p>Your SDC verification code is:</p><p style="font-size:28px;letter-spacing:6px"><strong>${code}</strong></p><p>This code expires in 10 minutes. It links your college address to your SDC account. If you didn't request it, ignore this message.</p>` });
}
export async function verifyCollegeCode(userId: string, code: unknown) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) throw new ValidationError("Enter the six-digit code from your college inbox.");
  try {
    const error = await db.transaction(async tx => {
      const [identity] = await tx.select().from(collegeIdentities).where(eq(collegeIdentities.userId, userId)).for("update");
      if (identity?.verifiedAt) return null;
      if (!identity?.codeHash || !identity.pendingEmail || !identity.expiresAt || identity.expiresAt.getTime() <= Date.now()) return "This code has expired. Request a new one.";
      if (identity.attempts >= 5) return "Too many incorrect codes. Request a new code.";
      if (!crypto.timingSafeEqual(Buffer.from(identity.codeHash, "hex"), Buffer.from(digest(userId, identity.pendingEmail, code), "hex"))) {
        await tx.update(collegeIdentities).set({ attempts: identity.attempts + 1 }).where(eq(collegeIdentities.userId, userId));
        return "That code isn't correct. Check your college inbox and try again.";
      }
      await tx.update(collegeIdentities).set({ collegeEmail: identity.pendingEmail, verifiedAt: new Date(), codeHash: null, pendingEmail: null, expiresAt: null }).where(eq(collegeIdentities.userId, userId));
      return null;
    });
    if (error) throw new ValidationError(error);
  } catch (error) { throwCollegeError(error); }
}
