import { db } from "../lib/db";
import { certificates, certificateTemplates, user, events } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { PdfmeRenderer } from "../lib/services/PdfmeRenderer";
import { LocalMockStorageService } from "../lib/services/storage";
import crypto from "crypto";

async function main() {
  try {
    const templateData = await db.query.certificateTemplates.findFirst();
    if (!templateData) return console.log("No templates found");
    
    console.log("Template found:", templateData.id);
    
    const userData = await db.query.user.findFirst();
    const eventData = await db.query.events.findFirst();
    
    const renderer = new PdfmeRenderer();
    const verifyCode = crypto.randomBytes(6).toString("hex");
    const verifyUrl = `http://localhost:3000/verify/${verifyCode}`;

    const inputs = {
      name: userData?.name || "Test User",
      eventName: eventData?.title || "Test Event",
      date: new Date().toLocaleDateString(),
      qr: verifyUrl
    };
    
    const template = {
      basePdf: templateData.basePdf,
      schemas: templateData.schemas as any,
    };

    console.log("Rendering...");
    const finalPdfBuffer = await renderer.render(template, [inputs]);
    console.log("Rendered! Size:", finalPdfBuffer.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
