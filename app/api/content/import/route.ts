import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { nanoid } from "nanoid";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionAuth = await requireRole(["content_lead", "co_lead", "lead", "admin", "owner"]);
    
    // Expect multipart/form-data with a file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    
    if (result.errors.length > 0) {
      return NextResponse.json({ error: "Invalid CSV format", details: result.errors }, { status: 400 });
    }

    const rows = result.data as any[];
    const itemsToInsert = [];

    for (const row of rows) {
      itemsToInsert.push({
        id: nanoid(),
        title: row.title || "Untitled Content",
        description: row.description || "",
        platform: row.platform || "unknown",
        status: row.status || "idea",
        authorId: sessionAuth.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (itemsToInsert.length > 0) {
      await db.insert(contentItems).values(itemsToInsert);
    }

    return NextResponse.json({ success: true, count: itemsToInsert.length }, { status: 201 });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Content Import POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
