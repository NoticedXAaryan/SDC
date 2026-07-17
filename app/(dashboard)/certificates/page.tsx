import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certificatesV2, events, certTemplates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Award } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";

export const dynamic = "force-dynamic";

export default async function UserCertificatesPage() {
  const session = await requireSession();

  const userCerts = await db.select({
    certificate: certificatesV2,
    event: events,
    template: certTemplates
  })
  .from(certificatesV2)
  .leftJoin(events, eq(certificatesV2.eventId, events.id))
  .leftJoin(certTemplates, eq(certificatesV2.templateId, certTemplates.id))
  .where(eq(certificatesV2.userId, session.user.id))
  .orderBy(desc(certificatesV2.issuedAt));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Award className="w-8 h-8 text-primary" /> My Certificates
        </h1>
        <p className="text-muted-foreground mt-2">View and download your earned event certificates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCerts.map(({ certificate, event, template }) => (
          <Card key={certificate.id} className="overflow-hidden flex flex-col">
            <div className="aspect-[1.414/1] bg-muted relative">
              {template?.backgroundUrl ? (
                <img src={template.backgroundUrl} alt="Certificate Background" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                  <Award className="w-12 h-12 opacity-20" />
                </div>
              )}
              {certificate.status === "revoked" && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold text-xl uppercase tracking-widest border-2 border-white px-4 py-2 rounded-md rotate-[-12deg]">
                    Revoked
                  </span>
                </div>
              )}
            </div>
            
            <CardHeader className="flex-1">
              <CardTitle className="line-clamp-1">{template?.name || "Certificate of Completion"}</CardTitle>
              <CardDescription className="line-clamp-2">
                {event?.title || "Event"}
              </CardDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Issued: {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'N/A'}
              </div>
            </CardHeader>
            
            <CardFooter className="gap-2 pt-0">
              <Button className="flex-1" variant="default" asChild disabled={certificate.status === "revoked" || !certificate.pdfUrl}>
                <a href={certificate.pdfUrl || "#"} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
              </Button>
              <Button variant="outline" size="icon" asChild title="Verify Certificate">
                <a href={`/verify/${certificate.verifyId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {userCerts.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Award}
              title="No certificates yet"
              description="Attend events and complete requirements to earn certificates. They will appear here once issued."
            />
          </div>
        )}
      </div>
    </div>
  );
}
