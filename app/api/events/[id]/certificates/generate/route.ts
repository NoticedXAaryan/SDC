import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrations, certTemplates } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq, and } from "drizzle-orm";
import { certificateQueue } from "@/lib/queues/certificates";
import { withApiHandler } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await requireAdmin();
    const { id } = await params;
    
    // Find event's template
    const templateData = await db.select().from(certTemplates).where(eq(certTemplates.eventId, id)).limit(1);
    const template = templateData[0];
    
    if (!template) {
        return NextResponse.json({ error: "No certificate template linked to this event." }, { status: 400 });
    }

    // Find all confirmed registrations
    const confirmedRegistrations = await db.select().from(registrations).where(
        and(
            eq(registrations.eventId, id),
            eq(registrations.status, "confirmed")
        )
    );

    if (confirmedRegistrations.length === 0) {
        return NextResponse.json({ error: "No confirmed registrations found for this event." }, { status: 400 });
    }

    // Add jobs to queue in bulk (fixes 1000+ limit)
    const jobs = confirmedRegistrations.map(reg => ({
        name: `generate-cert-${reg.userId}-${id}`,
        data: {
            userId: reg.userId,
            eventId: id,
            templateId: template.id,
            issuedBy: session.user.id
        }
    }));

    await certificateQueue.addBulk(jobs);

    return NextResponse.json({ 
        success: true, 
        message: `Successfully queued ${jobs.length} certificates for generation.` 
    });
});
