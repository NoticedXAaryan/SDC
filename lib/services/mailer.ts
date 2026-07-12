import sgMail from "@sendgrid/mail";
import { env } from "../env";

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export const Mailer = {
  /**
   * Sends an email using SendGrid.
   */
  async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!env.SENDGRID_API_KEY || !env.EMAIL_FROM_ADDRESS) {
      console.warn("⚠️ SENDGRID_API_KEY or EMAIL_FROM_ADDRESS is not set. Email not sent.");
      console.log(`[Email to ${to}] Subject: ${subject}`);
      return;
    }

    const fromName = env.EMAIL_FROM_NAME || "SDC Team";
    const fromAddress = env.EMAIL_FROM_ADDRESS;

    const msg = {
      to,
      from: {
        name: fromName,
        email: fromAddress
      },
      subject,
      html,
    };

    try {
      const response = await sgMail.send(msg);
      console.log(`✅ Email sent to ${to}`);
      return response;
    } catch (err: any) {
      console.error("❌ Failed to send email:", err.response ? err.response.body : err);
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

  /**
   * Send Event QR Pass
   */
  async sendEventQRPass(to: string, eventTitle: string, qrCodeDataUrl: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Your Pass for ${eventTitle}</h2>
        <p>You have successfully registered for <strong>${eventTitle}</strong>!</p>
        <p>Please present the QR code below at the venue entrance:</p>
        <div style="margin: 30px 0;">
          <img src="${qrCodeDataUrl}" alt="Your QR Pass" style="width: 250px; height: 250px; border-radius: 10px; border: 1px solid #eaeaea;" />
        </div>
        <p style="font-size: 12px; color: #666;">See you there!</p>
      </div>
    `;
    return this.sendEmail({ to, subject: `Your Pass for ${eventTitle}`, html });
  }
};
