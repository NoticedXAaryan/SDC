import * as dotenv from "dotenv";
import { resolve } from "path";
import { db } from "../lib/db";
import { user } from "../lib/db/schema";
import { eq } from "drizzle-orm";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { auth } from "../lib/auth";

async function bootstrap() {
  console.log("🚀 Starting STC-OS Bootstrap Process...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "System Admin";

  if (!adminEmail || !adminPassword) {
    console.error("❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your environment.");
    console.error("Please add them to your .env.local file or Dokploy environment variables.");
    process.exit(1);
  }

  try {
    // Check if the user already exists
    const [existingAdmin] = await db.select().from(user).where(eq(user.email, adminEmail));

    if (existingAdmin) {
      if (existingAdmin.role !== "owner") {
        console.log(`User ${adminEmail} exists but is not an owner. Upgrading role...`);
        // We can't directly update `role` via db if it's protected, but let's try direct DB update since it's a script
        await db.update(user).set({ role: "owner" }).where(eq(user.id, existingAdmin.id));
        console.log("✅ Role upgraded to owner.");
      } else {
        console.log("✅ Admin user already exists and is an owner. Skipping bootstrap.");
      }
      process.exit(0);
    }

    console.log(`Creating initial admin account for ${adminEmail}...`);

    // We must pass a dummy request to Better Auth since it expects headers
    // `asResponse: true` tells Better Auth not to crash if it's not in a true HTTP context
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      },
      asResponse: true,
    });

    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      throw new Error(`Failed to create admin user: ${signUpResponse.status} ${errorText}`);
    }

    console.log("✅ Admin user created successfully.");

    // Retrieve the newly created user to get their ID
    const [newAdmin] = await db.select().from(user).where(eq(user.email, adminEmail));

    if (!newAdmin) {
      throw new Error("Failed to retrieve created admin user from database.");
    }

    console.log("Upgrading new user to 'owner' role...");
    await db.update(user).set({ role: "owner" }).where(eq(user.id, newAdmin.id));

    console.log("🎉 Bootstrap complete! You can now log in to STC-OS.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Bootstrap failed:", error);
    process.exit(1);
  }
}

bootstrap();
