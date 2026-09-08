import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { env } from "../env";
import QRCode from "qrcode";
import { escapeHtml, sanitizeEmailHeader, toSafeHttpUrl } from "@/lib/email/html";
import { getDevelopmentMailbox } from "@/lib/auth-policy";

const resend = new Resend(env.RESEND_API_KEY || "dummy-key");

export const Mailer = {
  /**
   * Sends an email using Resend.
   */
  async sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
    const safeSubject = sanitizeEmailHeader(subject);
    if (!safeSubject) throw new Error("Email subject cannot be empty.");

    const mailbox = getDevelopmentMailbox(process.env);
    if (mailbox) {
      const response = await fetch(`${mailbox}/api/v1/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        redirect: "error",
        body: JSON.stringify({
          From: { Email: env.EMAIL_FROM_ADDRESS || "club@example.test", Name: sanitizeEmailHeader(env.EMAIL_FROM_NAME || "SDC Team") },
          To: [{ Email: to }],
          Subject: safeSubject,
          HTML: html,
          Attachments: attachments?.map((attachment) => ({
            Filename: attachment.filename,
            ContentType: attachment.contentType,
            Content: Buffer.isBuffer(attachment.content) ? attachment.content.toString("base64") : attachment.content,
          })),
        }),
      });
      if (!response.ok) throw new Error("The local test inbox could not accept this email.");
      const message = await response.json() as { ID: string };
      return { id: message.ID };
    }

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
      const message = "Email delivery is not configured (RESEND_API_KEY and EMAIL_FROM_ADDRESS are required).";
      logger.error({ to, subject }, message);
      throw new Error(message);
    }

    const fromName = sanitizeEmailHeader(env.EMAIL_FROM_NAME || "SDC Team");
    const fromAddress = env.EMAIL_FROM_ADDRESS;

    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject: safeSubject,
        html,
        attachments,
      });

      if (error) {
        console.error("❌ Resend API Error:", error);
        throw new Error(error.message);
      }

      logger.info(`✅ Email sent to ${to} (ID: ${data?.id})`);
      return data;
    } catch (err) {
      console.error("❌ Failed to send email:", err);
      throw err;
    }
  },

  /**
   * Send a password reset email
   */
  async sendPasswordReset(to: string, resetLink: string) {
    const safeResetLink = toSafeHttpUrl(resetLink);
    if (!safeResetLink) throw new Error("Password reset link must use HTTP or HTTPS.");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset Your SDC Password</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${escapeHtml(safeResetLink)}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendEmail({ to, subject: "Reset your password — Student Developer Club", html });
  },

  /**
   * Send an email verification link
   */
  async sendEmailVerification(to: string, verificationLink: string) {
    const safeVerificationLink = toSafeHttpUrl(verificationLink);
    if (!safeVerificationLink) throw new Error("Email verification link must use HTTP or HTTPS.");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Welcome to Student Developer Club! Please verify your email address by clicking the button below:</p>
        <a href="${escapeHtml(safeVerificationLink)}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Verify Email</a>
      </div>
    `;
    return this.sendEmail({ to, subject: "Verify your email — Student Developer Club", html });
  },

  async sendEventQRPass(to: string, eventTitle: string, passToken: string) {
    // Generate QR code base64 from the token
    const qrCodeDataUrl = await QRCode.toDataURL(passToken, { width: 300, margin: 2 });
    const base64Data = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, "");

    const safeEventTitle = escapeHtml(eventTitle);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Your Pass for ${safeEventTitle}</h2>
        <p>You have successfully registered for <strong>${safeEventTitle}</strong>!</p>
        <p>Please find your QR pass attached to this email. Present it at the venue entrance.</p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">See you there!</p>
      </div>
    `;
    
    return this.sendEmail({ 
      to, 
      subject: `Your Pass for ${eventTitle}`, 
      html,
      attachments: [{
        filename: 'pass.png',
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'image/png'
      }]
    });
  },

  async sendCertificate(to: string, eventTitle: string, pdfBuffer: Buffer, verifyUrl: string) {
    const safeEventTitle = escapeHtml(eventTitle);
    const normalizedVerifyUrl = toSafeHttpUrl(verifyUrl);
    if (!normalizedVerifyUrl) throw new Error("Certificate verification link must use HTTP or HTTPS.");
    const safeVerifyUrl = escapeHtml(normalizedVerifyUrl);
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Your Certificate for ${safeEventTitle}</h2>
        <p>Congratulations on participating in <strong>${safeEventTitle}</strong>!</p>
        <p>Please find your official certificate attached to this email.</p>
        <p><a href="${safeVerifyUrl}">Verify this certificate</a></p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">Thank you for joining us! — SDC Team</p>
      </div>
    `;
    
    return this.sendEmail({
      to,
      subject: `Your Certificate for ${eventTitle.replace(/[\r\n]+/g, " ")}`,
      html,
      attachments: [{
        filename: 'certificate.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
  }
};
