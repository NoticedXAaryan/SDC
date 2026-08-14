import type { EventCardViewModel } from "@/lib/landing/schedule";

interface EventCardProps {
  event: EventCardViewModel;
}

function getTypeBadgeClasses(typeLabel: EventCardViewModel["typeLabel"]): string {
  switch (typeLabel) {
    case "Open":
      return "bg-secondary/10 text-secondary";
    case "Registration":
      return "bg-primary/10 text-primary";
    case "Restricted":
      return "bg-ink-muted/10 text-ink-muted";
    case "Apply to Pitch":
      return "bg-primary-strong/10 text-primary-strong";
  }
}

function getRegistrationBadgeClasses(status: "open" | "full" | "closed"): string {
  switch (status) {
    case "open":
      return "bg-secondary/10 text-secondary";
    case "full":
      return "bg-primary/10 text-primary";
    case "closed":
      return "bg-ink-muted/10 text-ink-muted";
  }
}

function formatRegistrationLabel(status: "open" | "full" | "closed"): string {
  switch (status) {
    case "open":
      return "Open";
    case "full":
      return "Full";
    case "closed":
      return "Closed";
  }
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-md border border-surface-alt bg-surface p-6 shadow-sm">
      {/* Header: time range + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-primary">
          {event.timeRange}
        </span>
        <span
          className={`ml-auto inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${getTypeBadgeClasses(event.typeLabel)}`}
        >
          {event.typeLabel}
        </span>
        {event.registrationStatus && (
          <span
            className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${getRegistrationBadgeClasses(event.registrationStatus)}`}
          >
            {formatRegistrationLabel(event.registrationStatus)}
          </span>
        )}
      </div>

      {/* Event name */}
      <h3 className="mt-3 text-lg font-bold leading-tight">{event.name}</h3>

      {/* Details */}
      <dl className="mt-3 space-y-1 text-sm text-ink-muted">
        <div className="flex gap-2">
          <dt className="font-medium text-ink-muted/70">Venue:</dt>
          <dd>{event.venue}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-ink-muted/70">Coordinator:</dt>
          <dd>{event.coordinatorName}</dd>
        </div>
      </dl>
    </article>
  );
}
