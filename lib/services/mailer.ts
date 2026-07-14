import { Resend } from "resend";
import { env } from "../env";
import QRCode from "qrcode";

const resend = new Resend(env.RESEND_API_KEY || "dummy-key");

export const Mailer = {
  /**
   * Sends an email using Resend.
   */
  async sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
      console.warn("⚠️ RESEND_API_KEY or EMAIL_FROM_ADDRESS is not set. Email not sent.");
      console.log(`[Email to ${to}] Subject: ${subject}`);
      return;
    }

    const fromName = env.EMAIL_FROM_NAME || "SDC Team";
    const fromAddress = env.EMAIL_FROM_ADDRESS;

    try {
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject,
        html,
        attachments,
      });

      if (error) {
        console.error("❌ Resend API Error:", error);
        throw new Error(error.message);
      }

      console.log(`✅ Email sent to ${to} (ID: ${data?.id})`);
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
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset Your SDC OS Password</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendEmail({ to, subject: "Reset your password - SDC OS", html });
  },

  /**
   * Send an email verification link
   */
  async sendEmailVerification(to: string, verificationLink: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Welcome to SDC OS! Please verify your email address by clicking the button below:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Verify Email</a>
      </div>
    `;
    return this.sendEmail({ to, subject: "Verify your email - SDC OS", html });
  },

  async sendEventQRPass(to: string, eventTitle: string, passToken: string) {
    // Generate QR code base64 from the token
    const qrCodeDataUrl = await QRCode.toDataURL(passToken, { width: 300, margin: 2 });
    const base64Data = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, "");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Your Pass for ${eventTitle}</h2>
        <p>You have successfully registered for <strong>${eventTitle}</strong>!</p>
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

  async sendCertificate(to: string, eventTitle: string, pdfBuffer: Buffer) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Your Certificate for ${eventTitle}</h2>
        <p>Congratulations on participating in <strong>${eventTitle}</strong>!</p>
        <p>Please find your official certificate attached to this email.</p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">Thank you for joining us! — SDC Team</p>
      </div>
    `;
    
    return this.sendEmail({
      to,
      subject: `Your Certificate for ${eventTitle}`,
      html,
      attachments: [{
        filename: 'certificate.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
  }
};
