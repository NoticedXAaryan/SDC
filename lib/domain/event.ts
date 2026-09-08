export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export const PAID_EVENTS_UNAVAILABLE_MESSAGE =
  "Paid events cannot be published until a payment provider and verified webhook flow are configured";

const EVENT_TRANSITIONS: Record<EventStatus, readonly EventStatus[]> = {
  draft: ["published", "cancelled"],
  published: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export function canTransitionEventStatus(from: EventStatus, to: EventStatus): boolean {
  return from === to || EVENT_TRANSITIONS[from].includes(to);
}

export function assertEventConfiguration(event: {
  startsAt: Date | string;
  endsAt?: Date | string | null;
  registrationDeadline?: Date | string | null;
  isPaid?: boolean | null;
  price?: number | string | null;
}): void {
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const price = Number(event.price ?? 0);

  if (!Number.isFinite(startsAt.getTime())) throw new Error("Event start date is invalid");
  if (!endsAt || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error("Event end date must be after its start date");
  }
  if (deadline && (!Number.isFinite(deadline.getTime()) || deadline > startsAt)) {
    throw new Error("Registration deadline cannot be after the event starts");
  }
  if (event.isPaid && (!Number.isFinite(price) || price <= 0)) {
    throw new Error("Paid events require a price greater than 0");
  }
  if (!event.isPaid && price !== 0) {
    throw new Error("Free events must have a price of 0");
  }
}
