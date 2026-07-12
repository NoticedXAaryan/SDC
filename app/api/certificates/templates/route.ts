import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userRole = session.user.role || "member";
    if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Missing name" }, { status: 400 });
    }

    // Basic empty template
    const defaultTemplate = {
      basePdf: "https://pdfme.com/blank.pdf", // A simple blank pdf URL
      schemas: [
        {
          name: {
            type: "text",
            position: { x: 100, y: 100 },
            width: 100,
            height: 20
          },
          qr: {
            type: "qrcode",
            position: { x: 500, y: 400 },
            width: 50,
            height: 50
          }
        }
      ]
    };

    const id = crypto.randomUUID();
    await db.insert(certificateTemplates).values({
      id,
      name,
      basePdf: defaultTemplate.basePdf,
      schemas: defaultTemplate.schemas,
      createdBy: session.user.id
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
