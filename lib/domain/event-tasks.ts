export interface EventTaskContext {
  eventId: string;
  eventSlug: string;
  type: string;
  isInternal: boolean;
  startsAt: Date;
  endsAt: Date;
}

export interface EventTaskBlueprint {
  title: string;
  description: string;
  assigneeRole: string;
  dueDate: Date;
  actionHref?: string;
  actionLabel?: string;
}

type RelativeTask = Omit<EventTaskBlueprint, "dueDate"> & {
  dueFrom: "start" | "end";
  dueOffsetDays: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const EVENT_PREPARATION_TASKS: Record<string, RelativeTask[]> = {
  workshop: [
    { title: "Book venue", description: "Secure the lab or hall and confirm access requirements.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -14 },
    { title: "Prepare workshop material", description: "Create and review the presentation, exercises, and facilitator notes.", assigneeRole: "tech_lead", dueFrom: "start", dueOffsetDays: -3 },
    { title: "Open registration", description: "Review the registration form, capacity, and attendee instructions.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -10 },
    { title: "Publish event campaign", description: "Prepare and publish the event announcement across club channels.", assigneeRole: "marketing_lead", dueFrom: "start", dueOffsetDays: -7 },
  ],
  hackathon: [
    { title: "Confirm venue and operations", description: "Secure the venue and confirm power, network, access, and overnight arrangements.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -30 },
    { title: "Confirm sponsors and prizes", description: "Lock sponsor commitments, prize details, and delivery responsibilities.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -21 },
    { title: "Open team registration", description: "Review eligibility, team rules, capacity, and participant instructions.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -21 },
    { title: "Confirm judges and rubric", description: "Invite judges and publish a shared evaluation rubric.", assigneeRole: "tech_lead", dueFrom: "start", dueOffsetDays: -10 },
    { title: "Publish hackathon campaign", description: "Prepare the launch, reminder, and last-call communication sequence.", assigneeRole: "marketing_lead", dueFrom: "start", dueOffsetDays: -14 },
  ],
  seminar: [
    { title: "Confirm venue and speaker", description: "Lock the venue, speaker, session format, and technical requirements.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -14 },
    { title: "Prepare session artwork", description: "Create the event artwork and speaker assets for review.", assigneeRole: "content_lead", dueFrom: "start", dueOffsetDays: -7 },
    { title: "Publish seminar campaign", description: "Publish the announcement and scheduled reminders.", assigneeRole: "marketing_lead", dueFrom: "start", dueOffsetDays: -7 },
  ],
  social: [
    { title: "Confirm venue and run of show", description: "Confirm the venue, activity plan, and on-site responsibilities.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -10 },
    { title: "Publish community invite", description: "Prepare and publish the invite and reminder sequence.", assigneeRole: "marketing_lead", dueFrom: "start", dueOffsetDays: -7 },
  ],
  competition: [
    { title: "Confirm competition operations", description: "Finalize the venue, rules, judging flow, and participant support plan.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -21 },
    { title: "Prepare judging rubric", description: "Create and review the scoring rubric with the judging team.", assigneeRole: "tech_lead", dueFrom: "start", dueOffsetDays: -10 },
    { title: "Publish competition campaign", description: "Publish the launch and reminder communication sequence.", assigneeRole: "marketing_lead", dueFrom: "start", dueOffsetDays: -14 },
  ],
};

const INTERNAL_TASKS: RelativeTask[] = [
  { title: "Book meeting room", description: "Confirm a quiet room or online meeting link.", assigneeRole: "event_lead", dueFrom: "start", dueOffsetDays: -3 },
  { title: "Share meeting agenda", description: "Publish the agenda, desired decisions, and preparation notes.", assigneeRole: "lead", dueFrom: "start", dueOffsetDays: -1 },
];

const CERTIFICATE_TASKS: RelativeTask[] = [
  {
    title: "Prepare certificate template",
    description: "Upload the approved base PDF, place participant fields, and complete a final preview before the event.",
    assigneeRole: "content_lead",
    dueFrom: "start",
    dueOffsetDays: -3,
    actionLabel: "Design certificate",
  },
  {
    title: "Issue attendee certificates",
    description: "Reconcile verified check-ins, issue certificates, and review delivery status.",
    assigneeRole: "event_lead",
    dueFrom: "end",
    dueOffsetDays: 2,
    actionLabel: "Review certificate delivery",
  },
];

export function buildDefaultEventTasks(context: EventTaskContext): EventTaskBlueprint[] {
  const preparationTasks = context.isInternal
    ? INTERNAL_TASKS
    : (EVENT_PREPARATION_TASKS[context.type] ?? EVENT_PREPARATION_TASKS.workshop);
  const templates = context.isInternal ? preparationTasks : [...preparationTasks, ...CERTIFICATE_TASKS];

  return templates.map((task) => {
    const anchor = task.dueFrom === "start" ? context.startsAt : context.endsAt;
    const isCertificateDesign = task.title === "Prepare certificate template";
    const isCertificateDelivery = task.title === "Issue attendee certificates";

    return {
      title: task.title,
      description: task.description,
      assigneeRole: task.assigneeRole,
      dueDate: new Date(anchor.getTime() + task.dueOffsetDays * DAY_MS),
      actionHref: isCertificateDesign
        ? `/lead/certificates?eventId=${encodeURIComponent(context.eventId)}`
        : isCertificateDelivery
          ? `/events/${encodeURIComponent(context.eventSlug)}/manage?tab=certificates`
          : undefined,
      actionLabel: task.actionLabel,
    };
  });
}
