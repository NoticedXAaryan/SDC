import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { callAI } from "@/lib/services/ai";
import { z } from "zod";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

const prefillSchema = z.object({
  title: z.string().describe("The inferred title of the achievement or certificate"),
  description: z.string().describe("A short summary of what the achievement is and who issued it"),
});

export const POST = withApiHandler(async (req: NextRequest) => {
try {
await requireRole(["member", "alumni", "co_lead", "event_lead", "lead", "admin", "owner"]);

// Accept a raw text prompt for now (could be OCR text or a description of the proof)
const { text } = await req.json();

if (!text || text.trim().length < 10) {
  return NextResponse.json({ error: "Please provide enough context or text to scan." }, { status: 400 });
}

const prompt = `
      Extract the achievement details from the following raw text or OCR output.
      Determine a concise title for the achievement, and a brief description.
      
      Raw text:
      "${text}"
    `;

const result = await callAI(prompt, prefillSchema);

return NextResponse.json({ success: true, prefill: result });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Achievement Scan POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
