import { db } from "@/lib/db";
import { certificates, user, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  
  const certRows = await db.select().from(certificates).where(eq(certificates.verifyCode, code)).limit(1);
  const cert = certRows[0];
  
  if (!cert) {
    notFound();
  }

  const [userData] = await db.select().from(user).where(eq(user.id, cert.userId)).limit(1);
  const [eventData] = await db.select().from(events).where(eq(events.id, cert.eventId)).limit(1);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-4 border-b">
          <CardTitle className="text-3xl font-bold tracking-tight">Certificate Verification</CardTitle>
          <CardDescription>Verify the authenticity of a SDC certificate</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          
          <div className="flex justify-center">
            {cert.revoked ? (
              <Badge variant="destructive" className="text-lg px-4 py-1">Revoked</Badge>
            ) : (
              <Badge variant="default" className="text-lg px-4 py-1 bg-green-600 hover:bg-green-700">Valid Certificate</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Issued To</p>
              <p className="text-lg font-semibold">{userData?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Event</p>
              <p className="text-lg font-semibold">{eventData?.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
              <p className="font-medium">{new Date(cert.issuedAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Verification Code</p>
              <p className="font-mono bg-muted px-2 py-1 rounded inline-block text-sm">{cert.verifyCode}</p>
            </div>
          </div>

          <div className="space-y-1 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Cryptographic Hash (SHA-256)</p>
            <p className="font-mono text-xs text-muted-foreground break-all">{cert.hash}</p>
          </div>

          {cert.revoked && cert.revokedReason && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 mt-6">
              <p className="font-semibold text-sm mb-1">Reason for Revocation:</p>
              <p className="text-sm">{cert.revokedReason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
