import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/setup
 * A secure, one-time bootstrap endpoint for production deployments.
 * It reads ADMIN_EMAIL and ADMIN_PASSWORD from environment variables and provisions
 * the owner account. 
 * 
 * SECURITY: This endpoint immediately locks itself permanently once at least one 'owner' exists.
 */
export async function GET() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "System Admin";

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not set on the server." },
        { status: 500 }
      );
    }

    // Security Guard: Check if ANY owner exists in the database
    const [ownerCount] = await db.select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "owner"));

    if (Number(ownerCount.count) > 0) {
      return NextResponse.json(
        { error: "Setup is permanently locked. An owner account already exists in the system." },
        { status: 403 }
      );
    }

    // Check if the specific admin user already signed up but is just not an owner
    const [existingUser] = await db.select().from(user).where(eq(user.email, adminEmail));

    if (existingUser) {
      // Upgrade them to owner
      await db.update(user).set({ role: "owner" }).where(eq(user.id, existingUser.id));
      return NextResponse.json({
        success: true,
        message: `Existing user ${adminEmail} was successfully upgraded to owner. Setup is now locked.`
      });
    }

    // We must pass a dummy request to Better Auth since it expects headers
    // `asResponse: true` prevents it from crashing outside a normal request cycle
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

    // Retrieve the newly created user to upgrade their role
    const [newAdmin] = await db.select().from(user).where(eq(user.email, adminEmail));

    if (!newAdmin) {
      throw new Error("User created but could not be retrieved from database.");
    }

    // Upgrade to owner
    await db.update(user).set({ role: "owner" }).where(eq(user.id, newAdmin.id));

    return NextResponse.json({
      success: true,
      message: `Owner account ${adminEmail} created securely! Setup is now locked. You may log in.`
    });
  } catch (error: any) {
    console.error("[Setup API Error]:", error);
    return NextResponse.json({ error: "Internal server error during setup", details: error.message }, { status: 500 });
  }
}
