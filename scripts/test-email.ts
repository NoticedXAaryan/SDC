import { Mailer } from "../lib/services/mailer";
import { generateSignedPass } from "../lib/passes/qr";
import "dotenv/config";

async function main() {
  try {
    const payload = {
      userId: "test-user-id",
      eventId: "test-event-id",
      passCode: "test-pass-code"
    };
    const signedPass = generateSignedPass(payload);
    
    await Mailer.sendEventQRPass(
      "noticedxaaryan@gmail.com",
      "Test Event",
      signedPass
    );
    console.log("? Email sent successfully!");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
main();
