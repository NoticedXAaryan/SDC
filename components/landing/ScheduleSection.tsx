import type { ScheduleLoadResult } from "@/lib/landing/schedule-loader";
import { ScheduleExplorer } from "./ScheduleExplorer";

interface ScheduleSectionProps {
  schedule: ScheduleLoadResult;
}

export function ScheduleSection({ schedule }: ScheduleSectionProps) {
  return (
    <section
      id="schedule"
      aria-labelledby="schedule-title"
      className="bg-surface section-padding"
    >
      <div className="site-container">
        <header className="max-w-3xl">
          <p className="mb-2 font-semibold uppercase tracking-widest text-accent">
            Plan your week
          </p>
          <h2 id="schedule-title" className="font-bold text-ink">
            Upcoming Events
          </h2>
          <div aria-hidden="true" className="brand-rule mt-6 w-20 text-accent/40" />
          <p className="mt-6 text-lg text-ink-muted">
            Explore our upcoming workshops, tech talks, and open-source events. Plan your schedule and join the community.
          </p>
        </header>

        <div className="mt-12">
          {schedule.state === "ready" ? (
            <ScheduleExplorer events={schedule.events} />
          ) : (
            <p className="text-center text-ink-muted">
              Event data is temporarily unavailable.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
