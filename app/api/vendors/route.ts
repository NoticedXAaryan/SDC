import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { nanoid } from "nanoid";
import { desc } from "drizzle-orm";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allVendors = await db.select().from(vendors).orderBy(desc(vendors.createdAt));
    return NextResponse.json(allVendors);
  } catch (error) {
    console.error("[Vendors GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin", "owner", "finance_lead", "event_lead", "lead", "vice_lead"]);
    
    const body = await req.json();
    const parsed = vendorSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { name, contactName, email, phone, category, notes } = parsed.data;

    const [newVendor] = await db.insert(vendors).values({
      id: nanoid(),
      name,
      contactName,
      email: email || null,
      phone,
      category,
      notes,
    }).returning();

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Vendors POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
