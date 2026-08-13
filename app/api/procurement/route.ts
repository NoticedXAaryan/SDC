import { NextResponse, NextRequest } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { getProcurementRequests, createProcurementRequest, updateProcurementStatus } from "@/lib/dal/procurement";

const procurementSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  eventId: z.string().optional(),
  estimatedCost: z.number().int().min(0).optional(),
});

const procurementReviewSchema = z.object({
  status: z.enum(["draft", "pending_quotes", "approval", "approved", "rejected", "completed"]),
  selectedVendorId: z.string().optional(),
  quotesUrl: z.string().url().optional(),
  reason: z.string().optional(),
});

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
  const sessionAuth = await requireSession();
  const items = await getProcurementRequests(sessionAuth);
  return NextResponse.json(items);
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
  const sessionAuth = await requireSession();
  await checkEmergencyFreeze(sessionAuth.user.role as string);

  const body = await req.json();
  const parsed = procurementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
  }

  const newRequest = await createProcurementRequest(sessionAuth, parsed.data);
  return NextResponse.json(newRequest, { status: 201 });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const sessionAuth = await requireSession();
  await checkEmergencyFreeze(sessionAuth.user.role as string);

  const body = await req.json();
  const { id, ...updateData } = body;

  const parsed = procurementReviewSchema.safeParse(updateData);
  if (!parsed.success || !id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await updateProcurementStatus(sessionAuth, id, parsed.data);
  return NextResponse.json(result);
});
