import crypto from "crypto";
import { IPassValidator } from "../interfaces/IPassValidator";

// Ensure this secret is set in your .env.local
const PASS_SECRET = process.env.PASS_SECRET;

if (!PASS_SECRET) {
  throw new Error("PASS_SECRET is not defined in environment variables");
}

import jwt from "jsonwebtoken";
import { getRedisClient } from "../redis";

export interface PassPayload {
  userId: string;
  eventId: string;
  passCode: string;
  iat?: number; 
}

export function generateSignedPass(payload: PassPayload): string {
  const token = jwt.sign({ 
    eventId: payload.eventId, 
    userId: payload.userId, 
    passCode: payload.passCode,
    jti: crypto.randomUUID() 
  }, process.env.QR_SECRET || process.env.PASS_SECRET || "fallback_secret", { expiresIn: "30s" });
  return token;
}

export class HMACPassValidator implements IPassValidator {
  constructor(private secret: string = process.env.QR_SECRET || process.env.PASS_SECRET || "fallback_secret") {}

  async validate(payload: string): Promise<{ valid: boolean; eventId?: string; userId?: string; passCode?: string; iat?: number }> {
    try {
      const decoded = jwt.verify(payload, this.secret) as any;
      
      const redis = getRedisClient();
      const used = await redis.get(`qr:jti:${decoded.jti}`);
      if (used) {
        return { valid: false }; // QR already used
      }
      // Set short TTL matching token expiration
      await redis.setex(`qr:jti:${decoded.jti}`, 60, "1");

      return {
        valid: true,
        userId: decoded.userId,
        eventId: decoded.eventId,
        passCode: decoded.passCode,
        iat: decoded.iat
      };
    } catch (err) {
      return { valid: false };
    }
  }
}
