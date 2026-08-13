import { Mailer } from "../lib/services/mailer";

async function testEmail() {
  console.log("Sending test email...");
  try {
    const data = await Mailer.sendEmail({
      to: "hello@aaaryan.space",
      subject: "Test Email from SDC Platform",
      html: "<p>This is a test email to verify that the SDC platform email functionality is working correctly.</p>"
    });
    console.log("Email sent successfully:", data);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

testEmail();
