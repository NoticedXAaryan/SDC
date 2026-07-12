import crypto from "crypto";
import { IPassValidator } from "../interfaces/IPassValidator";

// Ensure this secret is set in your .env.local
const PASS_SECRET = process.env.PASS_SECRET || "default_dev_secret_please_change_in_prod";

export interface PassPayload {
  userId: string;
  eventId: string;
  passCode: string;
  iat?: number; // Issued at for rotating QR
}

/**
 * Generates an HMAC signed token string for a pass payload.
 */
export function generateSignedPass(payload: PassPayload): string {
  const iat = payload.iat || Math.floor(Date.now() / 1000);
  const dataString = JSON.stringify({
    u: payload.userId,
    e: payload.eventId,
    p: payload.passCode,
    i: iat
  });
  
  const hmac = crypto.createHmac("sha256", PASS_SECRET);
  hmac.update(dataString);
  const signature = hmac.digest("hex");
  
  // Format: base64(payload).signature
  const base64Payload = Buffer.from(dataString).toString("base64");
  return `${base64Payload}.${signature}`;
}

export class HMACPassValidator implements IPassValidator {
  constructor(private secret: string = PASS_SECRET) {}

  async validate(payload: string): Promise<{ valid: boolean; eventId?: string; userId?: string; iat?: number }> {
    try {
      const [base64Payload, signature] = payload.split(".");
      if (!base64Payload || !signature) return { valid: false };
      
      const dataString = Buffer.from(base64Payload, "base64").toString("utf-8");
      
      // Re-calculate signature
      const hmac = crypto.createHmac("sha256", this.secret);
      hmac.update(dataString);
      const expectedSignature = hmac.digest("hex");
      
      // Compare in constant time to prevent timing attacks
      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        const parsed = JSON.parse(dataString);
        return {
          valid: true,
          userId: parsed.u,
          eventId: parsed.e,
          iat: parsed.i
        };
      }
    } catch (err) {
      // Return false if JSON parsing or base64 decoding fails
      return { valid: false };
    }
    
    return { valid: false };
  }
}
