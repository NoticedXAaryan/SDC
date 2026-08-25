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
      className="border-t border-white/5 bg-[#070914] section-padding"
    >
      <div className="site-container">
        <header className="max-w-3xl">
          <p className="mb-2 font-semibold uppercase tracking-widest text-cyan-300">
            Plan your week
          </p>
          <h2 id="schedule-title" className="font-bold text-white">
            Upcoming Events
          </h2>
          <div aria-hidden="true" className="mt-6 h-px w-20 bg-gradient-to-r from-cyan-300 to-transparent" />
          <p className="mt-6 text-lg text-slate-400">
            Explore our upcoming workshops, tech talks, and open-source events. Plan your schedule and join the community.
          </p>
        </header>

        <div className="mt-12">
          {schedule.state === "ready" ? (
            <ScheduleExplorer events={schedule.events} />
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-slate-400">
              Event data is temporarily unavailable.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
