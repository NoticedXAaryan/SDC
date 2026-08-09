import { NextResponse } from "next/server";
import { generateInsightsAction } from "@/lib/actions/insights";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // In a real scenario, protect this endpoint via a secret header or allow only local cron triggers
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const result = await generateInsightsAction();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
