import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { withApiHandler, ValidationError } from "@/lib/api-wrapper";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { CertificateService } from "@/lib/services/certificates";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  templateId: z.string().min(1),
  eventId: z.string().min(1).optional().nullable(),
  idempotencyKey: z.string().max(128).optional(),
});

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const input = requestSchema.parse(await req.json().catch(() => ({})));
  const recipient = await db.query.user.findFirst({
    columns: { id: true },
    where: sql`lower(${user.email}) = ${input.email}`,
  });

  if (!recipient) throw new ValidationError("No account exists for that email address.");

  const result = await CertificateService.issueAdhocCertificates(
    session,
    input.templateId,
    [recipient.id],
    input.eventId,
    input.idempotencyKey
  );

  return NextResponse.json({
    success: true,
    count: result.count,
    message: "Certificate queued for generation and delivery.",
  });
});
