import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  try {
    const buffer = await QRCode.toBuffer(token, { width: 300, margin: 2 });
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (err) {
    return new NextResponse("Error generating QR", { status: 500 });
  }
}
