import Link from "next/link";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { Award, CheckCircle2, Clock3, PencilRuler, Send } from "lucide-react";

import { Card, Heading, Text, HStack, VStack } from "@astryxdesign/core";
import { IssueCertificatesButton } from "@/components/events/issue-certificates-button";
import { buttonVariants } from "@/components/ui/button";
import { getEligibleAttendeesForCertificates } from "@/lib/dal/certificates";
import { db } from "@/lib/db";
import { certificates, certTemplates, events } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type EventRecord = typeof events.$inferSelect;

export async function EventCertificatesTab({ event }: { event: EventRecord }) {
  const templateId = event.certificateTemplateId;
  const [template, eligibleAttendees, issuedRows, deliveredRows, pendingRows] = await Promise.all([
    templateId
      ? db.query.certTemplates.findFirst({ where: eq(certTemplates.id, templateId) })
      : Promise.resolve(undefined),
    templateId
      ? getEligibleAttendeesForCertificates(event.id, templateId)
      : Promise.resolve([]),
    templateId
      ? db.select({ count: sql<number>`count(*)` }).from(certificates).where(and(
          eq(certificates.eventId, event.id),
          eq(certificates.templateId, templateId),
          eq(certificates.status, "valid"),
        ))
      : Promise.resolve([{ count: 0 }]),
    templateId
      ? db.select({ count: sql<number>`count(*)` }).from(certificates).where(and(
          eq(certificates.eventId, event.id),
          eq(certificates.templateId, templateId),
          eq(certificates.status, "valid"),
          isNotNull(certificates.emailSentAt),
        ))
      : Promise.resolve([{ count: 0 }]),
    templateId
      ? db.select({ count: sql<number>`count(*)` }).from(certificates).where(and(
          eq(certificates.eventId, event.id),
          eq(certificates.templateId, templateId),
          eq(certificates.status, "valid"),
          isNull(certificates.emailSentAt),
        ))
      : Promise.resolve([{ count: 0 }]),
  ]);

  const issuedCount = Number(issuedRows[0]?.count ?? 0);
  const deliveredCount = Number(deliveredRows[0]?.count ?? 0);
  const pendingCount = Number(pendingRows[0]?.count ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <Award className="size-5" />
              <Heading level={3} className="text-lg">Certificate delivery</Heading>
            </HStack>
            <Text type="supporting">Issue only to verified check-ins and track delivery from one place.</Text>
          </VStack>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <HStack align="center" justify="between">
                <Text type="supporting" className="text-xs">Ready to issue</Text>
                <Send className="size-4 text-primary" />
              </HStack>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{eligibleAttendees.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <HStack align="center" justify="between">
                <Text type="supporting" className="text-xs">Delivered</Text>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </HStack>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{deliveredCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <HStack align="center" justify="between">
                <Text type="supporting" className="text-xs">Pending delivery</Text>
                <Clock3 className="size-4 text-amber-500" />
              </HStack>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{pendingCount}</p>
            </div>
          </div>

          {template ? (
            <div className="w-full rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {issuedCount} valid certificate{issuedCount === 1 ? "" : "s"} issued with this template.
              </p>
              {eligibleAttendees.length > 0 ? (
                <IssueCertificatesButton
                  eventId={event.id}
                  templateId={template.id}
                  eligibleCount={eligibleAttendees.length}
                />
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No new verified attendees are waiting for a certificate.
                </p>
              )}
            </div>
          ) : (
            <div className="w-full rounded-lg border border-dashed p-6 text-center">
              <Award className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Certificate design required</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Attach a reviewed template before attendee certificates can be issued.
              </p>
            </div>
          )}
        </VStack>
      </Card>

      <Card padding={6}>
        <VStack gap={5}>
          <VStack gap={1}>
            <HStack align="center" gap={2}>
              <PencilRuler className="size-5" />
              <Heading level={3} className="text-lg">Design handoff</Heading>
            </HStack>
            <Text type="supporting">The event and design teams share the same attached template.</Text>
          </VStack>

          {template ? (
            <>
              <div className="w-full rounded-lg border p-4">
                <p className="text-sm font-medium">{template.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Version {template.version ?? 1} · attached to this event</p>
              </div>
              <Link
                href={`/lead/certificates/templates/${template.id}/edit`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Review template design
              </Link>
            </>
          ) : (
            <Link
              href={`/lead/certificates?eventId=${encodeURIComponent(event.id)}`}
              className={cn(buttonVariants(), "w-full")}
            >
              Start certificate design
            </Link>
          )}
        </VStack>
      </Card>
    </div>
  );
}
