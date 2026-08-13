import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certificates, events, certTemplates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Download, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UserCertificatesPage() {
  const session = await requireSession();

  const userCerts = await db.select({
    certificate: certificates,
    event: events,
    template: certTemplates
  })
  .from(certificates)
  .leftJoin(events, eq(certificates.eventId, events.id))
  .leftJoin(certTemplates, eq(certificates.templateId, certTemplates.id))
  .where(eq(certificates.userId, session.user.id))
  .orderBy(desc(certificates.issuedAt));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="My Certificates" 
        description="View and download your earned event certificates."
      />

      {userCerts.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Attend events and complete requirements to earn certificates. They will appear here once issued."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCerts.map(({ certificate, event, template }) => (
            <Card key={certificate.id} className="overflow-hidden flex flex-col p-0">
              <div className="aspect-[1.414/1] bg-muted relative border-b border-border">
                {template?.backgroundUrl ? (
                  <img src={template.backgroundUrl} alt="Certificate Background" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                    {/* Placeholder image or icon */}
                    <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
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
              
              <div className="p-4 flex flex-col flex-1 gap-4">
                <VStack gap={1} className="flex-1">
                  <Text weight="bold" className="text-lg line-clamp-1">{template?.name || "Certificate of Completion"}</Text>
                  <Text type="supporting" className="text-sm line-clamp-2">{event?.title || "Event"}</Text>
                  <Text type="supporting" className="text-xs mt-1">
                    Issued: {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </VStack>
                
                <HStack gap={2} className="pt-2">
                  <div className="flex-1">
                    {certificate.status !== "revoked" && certificate.pdfUrl ? (
                      <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button 
                          variant="primary" 
                          label="Download" 
                          icon={<Download className="w-4 h-4" />} 
                          className="w-full justify-center"
                        />
                      </a>
                    ) : (
                      <Button 
                        variant="primary" 
                        label="Download" 
                        icon={<Download className="w-4 h-4" />} 
                        className="w-full justify-center"
                        isDisabled
                      />
                    )}
                  </div>
                  <a href={`/verify/${certificate.verifyId}`} target="_blank" rel="noopener noreferrer" title="Verify Certificate">
                    <Button 
                      variant="ghost" 
                      label="" 
                      icon={<ExternalLink className="w-4 h-4" />} 
                    />
                  </a>
                </HStack>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
