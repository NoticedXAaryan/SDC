import jwt, { type JwtPayload } from "jsonwebtoken";
import { IPassValidator } from "../interfaces/IPassValidator";

const PASS_SECRET = process.env.PASS_SECRET;
if (!PASS_SECRET) throw new Error("PASS_SECRET is not defined in environment variables");

export interface PassPayload {
  userId: string;
  eventId: string;
  passCode: string;
  iat?: number;
}
/** A saved pass lasts through the event. Cancellation/reissue is enforced in the database. */
export function generateSignedPass(payload: PassPayload, eventEndsAt?: Date | string | null): string {
  const expiresAt = eventEndsAt
    ? Math.floor(new Date(eventEndsAt).getTime() / 1000) + 24 * 60 * 60
    : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  if (!Number.isFinite(expiresAt)) throw new Error("Invalid event end date");
  return jwt.sign({ eventId: payload.eventId, userId: payload.userId, passCode: payload.passCode, exp: expiresAt }, PASS_SECRET!, { algorithm: "HS256" });
}
export class HMACPassValidator implements IPassValidator {
  constructor(private secret: string = PASS_SECRET!) {}
  async validate(token: string): Promise<{ valid: boolean; eventId?: string; userId?: string; passCode?: string; iat?: number }> {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ["HS256"] }) as JwtPayload;
      if (typeof decoded.eventId !== "string" || typeof decoded.userId !== "string" || typeof decoded.passCode !== "string" || typeof decoded.exp !== "number") {
        return { valid: false };
      }
      // Validation is read-only. Only the atomic registration update consumes
      // admission; a failed scan or retry must not invalidate a legitimate pass.
      return { valid: true, eventId: decoded.eventId, userId: decoded.userId, passCode: decoded.passCode, iat: decoded.iat };
    } catch { return { valid: false }; }
  }
}
