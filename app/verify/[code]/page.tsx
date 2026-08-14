import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { certificates, certTemplates, events, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const [cert] = await db.select({
    certificate: certificates,
    template: certTemplates,
    event: events,
    issuedBy: user
  })
  .from(certificates)
  .leftJoin(certTemplates, eq(certificates.templateId, certTemplates.id))
  .leftJoin(events, eq(certificates.eventId, events.id))
  .leftJoin(user, eq(certificates.issuedBy, user.id))
  .where(eq(certificates.verifyId, code))
  .limit(1);

  if (!cert || !cert.certificate) {
    notFound();
  }

  const { certificate, template, event, issuedBy } = cert;

  const isRevoked = certificate.status === "revoked";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-900 overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <VStack className="p-8 items-center text-center relative z-10" gap={6}>
          {isRevoked ? (
            <div className="inline-flex items-center rounded-md border border-red-900/50 bg-red-950/30 text-red-400 font-semibold uppercase tracking-widest text-lg py-2 px-4 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              Certificate Revoked
            </div>
          ) : (
            <div className="inline-flex items-center rounded-md border border-green-900/50 bg-green-950/30 text-green-400 font-semibold uppercase tracking-widest text-lg py-2 px-4 shadow-[0_0_20px_rgba(22,163,74,0.3)]">
              Verified & Authentic
            </div>
          )}

          <div className="space-y-2 w-full mt-4">
            <Text type="supporting" className="uppercase tracking-wider text-sm">Certificate ID</Text>
            <Text className="font-mono text-zinc-400 text-lg bg-zinc-900/50 py-2 rounded-md border border-zinc-800">{certificate.verifyId}</Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left mt-4">
            <VStack gap={1}>
              <Text type="supporting" className="text-sm">Recipient</Text>
              <Text weight="bold" className="text-xl">{(certificate.data as any)?.name || "Participant"}</Text>
            </VStack>
            
            <VStack gap={1}>
              <Text type="supporting" className="text-sm">Event</Text>
              <Text weight="bold" className="text-xl">{event?.title || "Event"}</Text>
            </VStack>

            <VStack gap={1}>
              <Text type="supporting" className="text-sm">Issued Date</Text>
              <Text className="text-zinc-300">
                {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"}
              </Text>
            </VStack>

            <VStack gap={1}>
              <Text type="supporting" className="text-sm">Issued By</Text>
              <Text className="text-zinc-300">{issuedBy?.name || "System"}</Text>
            </VStack>
          </div>

          {isRevoked && certificate.revokedReason && (
            <div className="w-full mt-4 p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-left">
              <Text type="supporting" className="text-red-400 text-sm mb-1">Revocation Reason</Text>
              <Text className="text-red-200">{certificate.revokedReason}</Text>
            </div>
          )}

          {!isRevoked && certificate.pdfUrl && (
            <div className="mt-6">
              <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors">
                View Certificate PDF
              </a>
            </div>
          )}
        </VStack>
      </Card>
    </div>
  );
}
