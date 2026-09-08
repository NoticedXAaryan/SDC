import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, contentItems } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { nanoid } from "nanoid";
import Papa from "papaparse";
import { withApiHandler } from "@/lib/api-wrapper";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_IMPORT_BYTES = 1_000_000;
const MAX_IMPORT_ROWS = 500;
const contentImportRowSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().default(""),
  platform: z.string().trim().max(80).optional().default(""),
  status: z.preprocess(
    (value) => value === "" || value == null ? undefined : value,
    z.enum(["idea", "drafting"]).optional(),
  ),
});

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const sessionAuth = await requireRole(["content_lead", "co_lead", "lead", "admin", "owner"]);

// Expect multipart/form-data with a file
const formData = await req.formData();
const file = formData.get("file") as File | null;

if (!file) {
  return NextResponse.json({ error: "No file provided" }, { status: 400 });
}
if (file.size <= 0 || file.size > MAX_IMPORT_BYTES) {
  return NextResponse.json({ error: "CSV file must be between 1 byte and 1 MB" }, { status: 400 });
}
if (!file.name.toLowerCase().endsWith(".csv")) {
  return NextResponse.json({ error: "Only .csv files are supported" }, { status: 400 });
}

const text = await file.text();
const result = Papa.parse<Record<string, unknown>>(text, {
  header: true,
  skipEmptyLines: "greedy",
  transformHeader: (header) => header.trim().toLowerCase(),
});

if (result.errors.length > 0) {
  return NextResponse.json({ error: "Invalid CSV format", details: result.errors }, { status: 400 });
}

if (result.data.length > MAX_IMPORT_ROWS) {
  return NextResponse.json({ error: `A single import can contain at most ${MAX_IMPORT_ROWS} rows` }, { status: 400 });
}

const parsedRows = result.data.map((row, index) => ({
  row: index + 2,
  result: contentImportRowSchema.safeParse(row),
}));
const invalidRows = parsedRows
  .filter((entry) => !entry.result.success)
  .map((entry) => ({
    row: entry.row,
    errors: entry.result.error?.flatten().fieldErrors,
  }));
if (invalidRows.length > 0) {
  return NextResponse.json({ error: "Some CSV rows are invalid", rows: invalidRows.slice(0, 50) }, { status: 400 });
}

const itemsToInsert = parsedRows.map((entry) => {
  const row = entry.result.data!;
  return {
    id: nanoid(),
    title: row.title,
    description: row.description,
    platform: row.platform || null,
    status: row.status || (row.description ? "drafting" as const : "idea" as const),
    authorId: sessionAuth.user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

if (itemsToInsert.length > 0) {
  await db.transaction(async (tx) => {
    await tx.insert(contentItems).values(itemsToInsert);
    await tx.insert(auditLogs).values({
      id: nanoid(),
      actorId: sessionAuth.user.id,
      action: "content_imported",
      entity: "content",
      details: JSON.stringify({ count: itemsToInsert.length, filename: file.name.slice(0, 255) }),
      timestamp: new Date(),
    });
  });
}

return NextResponse.json({ success: true, count: itemsToInsert.length }, { status: 201 });

});
