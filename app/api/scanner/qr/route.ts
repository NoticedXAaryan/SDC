import { NextResponse, NextRequest } from "next/server";
import QRCode from "qrcode";
import { withApiHandler } from "@/lib/api-wrapper";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  
  if (!token || token.length > 2048) {
    return new NextResponse("A valid token is required", { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(token, { width: 300, margin: 2 });
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store"
      }
    });
  } catch (err) {
    return new NextResponse("Error generating QR", { status: 500 });
  }
});
