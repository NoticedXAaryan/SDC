import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/services/audit";

import { fileTypeFromBuffer } from "file-type";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * POST /api/upload
 * Handles local file uploads to public/uploads.
 * Requires any authenticated role (or specific roles depending on business logic).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["member", "lead", "co_lead", "finance_lead", "admin", "owner"]);
    
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WEBP, PDF" }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename to prevent collisions
    const fileExtension = path.extname(file.name) || ".bin";
    const baseName = path.basename(file.name, fileExtension).replace(/[^a-zA-Z0-9]/g, "-");
    const uniqueId = crypto.randomBytes(4).toString("hex");
    const newFileName = `${baseName}-${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadDir, newFileName);

    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${newFileName}`;

    await logAuditEvent({
      actorId: session.user.id,
      action: "file_upload",
      entity: "file",
      entityId: newFileName,
      details: `Uploaded file of size ${buffer.length} bytes to ${fileUrl}`,
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      size: buffer.length,
      name: newFileName,
    });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Upload POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
