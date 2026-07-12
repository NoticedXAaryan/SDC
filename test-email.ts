import { Mailer } from "./lib/services/mailer";

async function test() {
  console.log("Sending test email...");
  try {
    const result = await Mailer.sendEmail({
      to: "aaryantiwari890@gmail.com",
      subject: "Test Email from SDC OS",
      html: "<h1>It Works!</h1><p>This is a test email sent using Resend.</p>"
    });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
