import "dotenv/config";
import { db } from "../lib/db";
import { certificates, certificateTemplates, user, events } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { PdfmeRenderer } from "../lib/services/PdfmeRenderer";
import { LocalMockStorageService } from "../lib/services/storage";
import { Mailer } from "../lib/services/mailer";
import crypto from "crypto";
import { env } from "../lib/env";

async function main() {
  try {
    // 1. Create or find test user
    const testEmail = "noticedxaaryan@gmail.com";
    let userData = await db.query.user.findFirst({ where: eq(user.email, testEmail) });
    
    if (!userData) {
      console.log("Test user not found, creating one...");
      const newUserId = crypto.randomUUID();
      await db.insert(user).values({
        id: newUserId,
        email: testEmail,
        name: "Aaryan Test",
        role: "admin",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userData = await db.query.user.findFirst({ where: eq(user.id, newUserId) });
    }
    
    if (!userData) throw new Error("Could not create user");
    console.log(`Using user: ${userData.name} (${userData.email})`);

    // 2. Create or find an event
    let eventData = await db.query.events.findFirst();
    if (!eventData) {
       const newEventId = crypto.randomUUID();
       await db.insert(events).values({
         id: newEventId,
         title: "Test Event for Certificate",
         slug: "test-event-cert",
         description: "Testing certificate circulation",
         status: "published",
         type: "workshop",
         location: "Online",
         startsAt: new Date(),
         endsAt: new Date(Date.now() + 86400000),
         createdBy: userData.id
       });
       eventData = await db.query.events.findFirst({ where: eq(events.id, newEventId) });
    }
    
    if (!eventData) throw new Error("Could not find or create event");
    console.log(`Using event: ${eventData.title}`);

    // 3. Find template
    // Clean up old bad template first
    await db.delete(certificateTemplates).where(eq(certificateTemplates.name, "Default Certificate Template"));

    let templateData = await db.query.certificateTemplates.findFirst();
    if (!templateData) {
      console.log("No certificate template found, creating a default one...");
      const fs = require("fs");
      const path = require("path");
      const pdfPath = path.join(__dirname, "../node_modules/bwip-js/examples/bwip-js.pdf");
      const dummyPdfBase64 = fs.readFileSync(pdfPath).toString("base64");
      
      const newTemplateId = crypto.randomUUID();
      await db.insert(certificateTemplates).values({
        id: newTemplateId,
        name: "Default Certificate Template",
        basePdf: dummyPdfBase64,
        schemas: [
          {
            name: { type: "text", position: { x: 50, y: 50 }, width: 100, height: 10 },
            eventName: { type: "text", position: { x: 50, y: 70 }, width: 100, height: 10 },
            date: { type: "text", position: { x: 50, y: 90 }, width: 100, height: 10 },
            qr: { type: "qrcode", position: { x: 50, y: 110 }, width: 30, height: 30 }
          }
        ],
        createdBy: userData.id
      });
      templateData = await db.query.certificateTemplates.findFirst({ where: eq(certificateTemplates.id, newTemplateId) });
    }
    
    if (!templateData) throw new Error("Could not find or create template");
    console.log(`Using template: ${templateData.name}`);

    // 4. Generate Certificate
    console.log("Rendering PDF...");
    const renderer = new PdfmeRenderer();
    
    const verifyCode = crypto.randomBytes(6).toString("hex");
    const verifyUrl = `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${verifyCode}`;

    const inputs: Record<string, any> = {
      name: userData.name,
      eventName: eventData.title,
      date: new Date().toLocaleDateString(),
      qr: verifyUrl
    };
    
    const template = {
      basePdf: templateData.basePdf.startsWith("data:application/pdf;base64,") ? templateData.basePdf : `data:application/pdf;base64,${templateData.basePdf}`,
      schemas: templateData.schemas as any,
    };

    const finalPdfBuffer = await renderer.render(template, [inputs]);
    const hash = crypto.createHash("sha256").update(finalPdfBuffer).digest("hex");
    console.log(`Rendered PDF. Size: ${finalPdfBuffer.length} bytes`);

    // 5. Save to Storage and DB
    const storage = new LocalMockStorageService();
    const pdfUrl = await storage.uploadFile(finalPdfBuffer, `certs/${verifyCode}.pdf`, "application/pdf");

    await db.insert(certificates).values({
      id: crypto.randomUUID(),
      verifyCode,
      userId: userData.id,
      eventId: eventData.id,
      templateId: templateData.id,
      pdfUrl,
      hash,
      issuedBy: userData.id
    });
    console.log(`Saved certificate to DB. Verify Code: ${verifyCode}`);

    // 6. Send Email
    console.log(`Sending email to ${userData.email}...`);
    await Mailer.sendCertificate(userData.email, eventData.title, Buffer.from(finalPdfBuffer));
    console.log("Email sent successfully!");

  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
