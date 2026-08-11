import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { generateCertificates } from "@/lib/dal/certificates";
export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await requireSession();
    const { id } = await params;
    
    const result = await generateCertificates(session, id);
    return NextResponse.json({ 
        success: true, 
        message: `Successfully queued ${result.count} certificates for generation.` 
    });
});

