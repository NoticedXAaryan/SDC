/**
 * StudentDashboard — SOC space-themed member overview.
 * Journey: "Discover and join" / "Contribute and grow"
 * All states: empty, data, error handled via parent Suspense.
 *
 * Doc ref: §02 member workspace journey, §04 brand, §09 accessibility.
 * Astryx-first: Button, Badge from @astryxdesign/core.
 * SOC layer: OrbitalMetric, CosmicSurface, EmptyCosmicState.
 * Shadcn exception: None in this component.
 */
"use client";

import React from "react";
import Link from "next/link";
import {
  Zap, Trophy, TrendingUp, Clock, QrCode,
  FileText, ArrowRight, CheckCircle2, Circle,
  Award, ChevronRight, Calendar,
} from "lucide-react";
import { Button, Badge } from "@astryxdesign/core";
import { OrbitalMetric, OrbitalMetricGrid } from "@/components/design-system/cosmic/OrbitalMetric";
import { CosmicSurface, EmptyCosmicState, LensingDivider } from "@/components/design-system/cosmic/CosmicSurface";

import {
  DashboardUser,
  UserRegistration,
  UserApplication,
  UserCertificate,
} from "./dashboard-types";

interface StudentDashboardProps {
  user: DashboardUser;
  myRegistrations?: UserRegistration[];
  myApplication?: UserApplication | null;
  myCertificates?: UserCertificate[];
}

const APPLICATION_STEPS: { key: string; label: string; description: (status: string) => string }[] = [
  { key: "applied",      label: "Applied",           description: () => "Application submitted" },
  { key: "ai_graded",   label: "Online Assessment",  description: (s) => s === "ai_graded" ? "Under review" : s === "needs_manual_review" || s === "interviewing" || s === "accepted" ? "Completed" : "Pending" },
  { key: "interviewing", label: "Interview",          description: (s) => s === "interviewing" ? "Scheduled" : s === "accepted" ? "Completed" : "Not scheduled" },
  { key: "accepted",     label: "Result",             description: (s) => s === "accepted" ? "Accepted 🎉" : s === "rejected" ? "Not selected" : "TBD" },
];

function isStepDone(stepKey: string, status: string | null): boolean {
  const order = ["applied", "ai_graded", "needs_manual_review", "interviewing", "accepted", "rejected"];
  const stepIndex = order.indexOf(stepKey);
  const statusIndex = order.indexOf(status || "");
  return statusIndex >= stepIndex && statusIndex >= 0;
}

export function StudentDashboard({
  user,
  myRegistrations = [],
  myApplication,
  myCertificates = [],
}: StudentDashboardProps) {
  const nextEvent = myRegistrations[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-enter">

      {/* ── 1. Orbital Metrics ─────────────────────────────────── */}
      <section aria-labelledby="member-kpi-heading">
        <h2 id="member-kpi-heading" className="sr-only">Your membership stats</h2>
        <OrbitalMetricGrid cols={3}>
          <OrbitalMetric
            title="Activity Score"
            value={user.points ?? 0}
            icon={<Zap aria-hidden="true" size={16} />}
            accent="lime"
            trend={user.points && user.points > 50 ? "up" : "neutral"}
            trendLabel={user.points && user.points > 50 ? "Active" : "Keep going"}
          />
          <OrbitalMetric
            title="Events Attended"
            value={myRegistrations.length}
            icon={<Trophy aria-hidden="true" size={16} />}
            accent="violet"
          />
          <OrbitalMetric
            title="Current Level"
            value={`Level ${user.level ?? 1}`}
            icon={<TrendingUp aria-hidden="true" size={16} />}
            accent="blue"
          />
        </OrbitalMetricGrid>
      </section>

      {/* ── 2. Up Next + Applications (two-column) ─────────────── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Up Next — upcoming registered events */}
        <CosmicSurface variant="default" padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--d-line)]">
            <div className="flex items-center gap-2">
              <Clock aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
              <h3 className="text-sm font-semibold text-[var(--color-fg)]">Up Next</h3>
            </div>
            <Link
              href="/events"
              className="text-xs text-[var(--soc-accretion-violet)] hover:underline flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
            >
              Browse events <ChevronRight aria-hidden="true" size={12} />
            </Link>
          </div>

          {myRegistrations.length === 0 ? (
            <EmptyCosmicState
              title="No upcoming events"
              description="Register for an event to see it here."
              illustration="orbit"
              size="sm"
              action={
                <Button href="/events" label="Browse events" variant="primary" size="sm" />
              }
            />
          ) : (
            <div className="divide-y divide-[var(--d-line)]">
              {myRegistrations.slice(0, 4).map((reg) => (
                <div key={reg.eventId} className="flex items-center justify-between px-5 py-3.5 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      aria-hidden="true"
                      className="h-8 w-8 rounded-lg bg-[rgba(124,58,237,0.12)] flex items-center justify-center shrink-0"
                    >
                      <Calendar aria-hidden="true" size={14} className="text-[var(--soc-accretion-violet)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-fg)] truncate">{reg.eventTitle}</p>
                      <Badge variant="success" label="Registered" />
                    </div>
                  </div>
                  <Link
                    href={`/passes/${reg.eventId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--soc-accretion-violet)] hover:underline shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
                  >
                    <QrCode aria-hidden="true" size={12} />
                    Pass
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CosmicSurface>

        {/* Applications Timeline */}
        <CosmicSurface variant="default" padding="none">
          <div className="px-5 py-4 border-b border-[var(--d-line)]">
            <h3 className="text-sm font-semibold text-[var(--color-fg)]">My Application</h3>
            <p className="text-xs text-[var(--color-fg-dim)] mt-0.5">Current recruitment cycle</p>
          </div>

          {myApplication ? (
            <div className="px-5 py-5">
              <ol aria-label="Application progress" className="relative border-l border-[var(--d-line)] ml-3 space-y-6">
                {APPLICATION_STEPS.map((step) => {
                  const done = isStepDone(step.key, myApplication.status);
                  const active = myApplication.status === step.key ||
                    (step.key === "ai_graded" && myApplication.status === "needs_manual_review");
                  return (
                    <li key={step.key} className="relative pl-6">
                      {/* Timeline dot */}
                      <div
                        aria-hidden="true"
                        className={`absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                          done
                            ? "bg-[var(--color-positive)] border-[var(--color-positive)]"
                            : active
                              ? "bg-[var(--d-panel)] border-[var(--soc-accretion-violet)]"
                              : "bg-[var(--d-panel)] border-[var(--d-line)]"
                        }`}
                      >
                        {done && <CheckCircle2 size={10} className="text-white" />}
                        {!done && active && <Circle size={6} className="text-[var(--soc-accretion-violet)] fill-[var(--soc-accretion-violet)]" />}
                      </div>
                      <p className={`text-sm font-medium ${active ? "text-[var(--soc-accretion-violet)]" : done ? "text-[var(--color-fg)]" : "text-[var(--color-fg-dim)]"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-[var(--color-fg-dim)] mt-0.5">
                        {step.description(myApplication.status || "")}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <EmptyCosmicState
              title="No active application"
              description="Apply to become a club member and start your journey."
              illustration="orbit"
              size="sm"
              action={
                <Button href="/recruitment/apply" label="Apply now" variant="primary" size="sm" />
              }
            />
          )}
        </CosmicSurface>
      </div>

      {/* ── 3. Member ID Card + Certificate Wallet ─────────────── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Member ID Card — cosmic dark card */}
        <div
          role="region"
          aria-label="Your member ID card"
          className="relative overflow-hidden rounded-[var(--radius-tile)] p-6 flex flex-col justify-between min-h-[200px]"
          style={{
            background: "linear-gradient(135deg, #1a0a3d 0%, #0a0514 60%, #04020a 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
        >
          {/* Decorative orbital ring */}
          <div
            aria-hidden="true"
            className="absolute right-4 top-4 w-32 h-32 rounded-full border border-[rgba(168,85,247,0.15)] pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute right-4 top-4 w-20 h-20 rounded-full border border-[rgba(168,85,247,0.1)] pointer-events-none"
          />

          <div className="relative z-10">
            <Badge variant="purple" label="Member ID" />
            <h3 className="text-2xl font-bold text-white mt-4 tracking-tight">{user.name}</h3>
            <p className="text-[rgba(255,255,255,0.5)] text-sm mt-1">@{user.username ?? "member"}</p>
          </div>

          <div className="relative z-10 flex items-end justify-between mt-6">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Role</p>
                <p className="text-sm font-semibold text-white capitalize mt-0.5">
                  {(user.role ?? "member").replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.4)]">Joined</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
                </p>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="text-[rgba(168,85,247,0.3)]"
            >
              <QrCode size={32} />
            </div>
          </div>
        </div>

        {/* Certificate Wallet */}
        <CosmicSurface variant="default" padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--d-line)]">
            <div className="flex items-center gap-2">
              <Award aria-hidden="true" size={16} className="text-[var(--color-fg-dim)]" />
              <h3 className="text-sm font-semibold text-[var(--color-fg)]">Certificate Wallet</h3>
            </div>
            <Link
              href="/certificates"
              className="text-xs text-[var(--soc-accretion-violet)] hover:underline flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
            >
              View all <ChevronRight aria-hidden="true" size={12} />
            </Link>
          </div>

          {myCertificates.length === 0 ? (
            <EmptyCosmicState
              title="No certificates yet"
              description="Attend events and complete activities to earn certificates."
              illustration="void"
              size="sm"
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto p-4 hide-scrollbar snap-x" role="list" aria-label="Your certificates">
              {myCertificates.map((cert) => (
                <Link
                  key={cert.id}
                  href={`/verify/${cert.verifyId}`}
                  role="listitem"
                  className="
                    min-w-[180px] snap-center block group rounded-xl p-4 flex-shrink-0
                    border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.05)]
                    hover:border-[rgba(59,130,246,0.4)] hover:bg-[rgba(59,130,246,0.08)]
                    hover:-translate-y-1 transition-all duration-[var(--motion-content)]
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]
                  "
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(59,130,246,0.15)] text-blue-400 mb-3">
                    <FileText aria-hidden="true" size={16} />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-fg)] truncate">
                    {cert.data?.eventName ?? "Certificate"}
                  </p>
                  <p className="text-xs text-[var(--color-fg-dim)] mt-1">
                    {cert.issuedAt ? new Date(cert.issuedAt).getFullYear() : "N/A"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CosmicSurface>
      </div>
    </div>
  );
}
