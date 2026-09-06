import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { importEventAttendees } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > 1_000_000 || !file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "Choose a .csv file up to 1 MB" }, { status: 400 });
  }

  const text = await file.text();
  const result = await importEventAttendees(session, id, text);

  return NextResponse.json({ success: true, ...result });
});
