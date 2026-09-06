import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { AuthorizationError, ValidationError, withApiHandler } from "@/lib/api-wrapper";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { formFields, forms } from "@/lib/db/schema";
import { isUniversityEmail } from "@/lib/forms/response-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/services/audit";
import { getStorageService } from "@/lib/services/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export const POST = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const rateLimit = await checkRateLimit(request, `form_upload_${id}`);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many upload attempts" }, { status: 429 });
  }

  const session = await getCurrentUser();
  const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!form || form.status !== "published") throw new ValidationError("Form is not accepting uploads");

  const settings = form.settings as {
    allowExternal?: boolean;
    requireLogin?: boolean;
    collegeDomainOnly?: boolean;
  };
  if ((settings.requireLogin || !settings.allowExternal) && !session?.user) {
    throw new AuthorizationError("Login required");
  }
  if (settings.collegeDomainOnly && (!session?.user || !isUniversityEmail(session.user.email))) {
    throw new AuthorizationError("A university account is required");
  }

  const payload = await request.formData();
  const fieldId = payload.get("fieldId");
  const file = payload.get("file");
  if (typeof fieldId !== "string" || !(file instanceof File)) {
    throw new ValidationError("Choose a file to upload");
  }
  if (file.size > MAX_FILE_SIZE) throw new ValidationError("File exceeds the 10 MB limit");

  const [field] = await db.select().from(formFields).where(and(
    eq(formFields.id, fieldId),
    eq(formFields.formId, id),
    eq(formFields.type, "file"),
  )).limit(1);
  if (!field) throw new ValidationError("This form field does not accept files");

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !MIME_EXTENSIONS[detectedType.mime]) {
    throw new ValidationError("Only PDF, JPG, PNG, and WebP files are supported");
  }

  const configuredExtensions = Array.isArray(field.options)
    ? field.options.filter((option): option is string => typeof option === "string").map((option) => option.toLowerCase())
    : [];
  if (configuredExtensions.length > 0 && !MIME_EXTENSIONS[detectedType.mime].some((extension) => configuredExtensions.includes(extension))) {
    throw new ValidationError("This file type is not allowed for this field");
  }

  const filename = `form-${id}-${fieldId}-${crypto.randomBytes(10).toString("hex")}.${detectedType.ext}`;
  const url = await getStorageService().uploadFile(buffer, filename, detectedType.mime);

  if (session?.user) {
    await logAuditEvent({
      actorId: session.user.id,
      action: "file_upload",
      entity: "file",
      entityId: filename,
      details: JSON.stringify({ formId: id, fieldId, size: buffer.length }),
    });
  }

  return NextResponse.json({ success: true, url });
}, { requireAuth: false });
