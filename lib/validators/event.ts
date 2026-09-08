import { z } from "zod";

export const eventRegistrationFieldSchema = z.object({
  id: z.string().trim().min(1).max(100),
  type: z.enum(["text", "textarea", "dropdown"]),
  question: z.string().trim().min(1).max(300),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
}).superRefine((field, ctx) => {
  if (field.type === "dropdown" && (!field.options || field.options.length === 0)) {
    ctx.addIssue({
      code: "custom",
      message: "Dropdown fields require at least one option",
      path: ["options"],
    });
  }
});

export const createEventBaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  type: z.enum(["hackathon", "workshop", "seminar", "social", "competition"]),
  domain: z.string().max(100).optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  location: z.string().max(200).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  isInternal: z.boolean().default(false),
  startsAt: z.string().datetime({ message: "Invalid start date" }),
  endsAt: z.string().datetime({ message: "Invalid end date" }),
  registrationDeadline: z.string().datetime().optional(),
  isPaid: z.boolean().default(false),
  price: z.number().min(0).optional(),
  visibility: z.enum(["public", "private", "unlisted", "members_only", "invite_only"]).default("public"),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  attendanceEstimates: z.number().int().min(1).max(100000).optional(),
  forms: z.array(eventRegistrationFieldSchema).max(50).optional(),
  certificateTemplateId: z.string().trim().min(1).max(200).optional(),
});

export const createEventSchema = createEventBaseSchema.refine(
  (data) => {
    if (data.isPaid && (!data.price || data.price <= 0)) {
      return false;
    }
    return true;
  },
  { message: "Price is required for paid events and must be greater than 0", path: ["price"] }
).refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  { message: "End date must be after start date", path: ["endsAt"] }
).refine(
  (data) => !data.registrationDeadline || new Date(data.registrationDeadline) <= new Date(data.startsAt),
  { message: "Registration deadline cannot be after the event starts", path: ["registrationDeadline"] }
).refine(
  (data) => data.isPaid || data.price === undefined || data.price === 0,
  { message: "Free events must have a price of 0", path: ["price"] }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventBaseSchema.partial().extend({
  status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
  parentId: z.string().optional().nullable(),
  checklist: z.array(z.any()).optional(),
  staff: z.array(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.isPaid === true && data.price !== undefined && data.price <= 0) {
    ctx.addIssue({ code: "custom", message: "Paid events require a price greater than 0", path: ["price"] });
  }
  if (data.isPaid === false && data.price !== undefined && data.price !== 0) {
    ctx.addIssue({ code: "custom", message: "Free events must have a price of 0", path: ["price"] });
  }
  if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
    ctx.addIssue({ code: "custom", message: "End date must be after start date", path: ["endsAt"] });
  }
  if (data.registrationDeadline && data.startsAt && new Date(data.registrationDeadline) > new Date(data.startsAt)) {
    ctx.addIssue({ code: "custom", message: "Registration deadline cannot be after the event starts", path: ["registrationDeadline"] });
  }
});

export const eventRegistrationResponsesSchema = z.record(
  z.string().trim().min(1).max(100),
  z.string().trim().max(5000),
);

export function validateEventRegistrationResponses(
  fields: unknown,
  responses: unknown,
): Record<string, string> {
  const parsedFields = z.array(eventRegistrationFieldSchema).max(50).parse(fields ?? []);
  const parsedResponses = eventRegistrationResponsesSchema.parse(responses ?? {});
  const allowedIds = new Set(parsedFields.map((field) => field.id));

  for (const key of Object.keys(parsedResponses)) {
    if (!allowedIds.has(key)) {
      throw new z.ZodError([{ code: "custom", message: "Unknown registration field", path: [key] }]);
    }
  }

  for (const field of parsedFields) {
    const value = parsedResponses[field.id]?.trim() ?? "";
    if (field.required && !value) {
      throw new z.ZodError([{ code: "custom", message: `Response required for ${field.question}`, path: [field.id] }]);
    }
    if (field.type === "dropdown" && value && !field.options?.includes(value)) {
      throw new z.ZodError([{ code: "custom", message: `Invalid option for ${field.question}`, path: [field.id] }]);
    }
  }

  return parsedResponses;
}

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  type: z.enum(["hackathon", "workshop", "seminar", "social", "competition"]).optional(),
  status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
  domain: z.string().optional(),
  upcoming: z.coerce.boolean().optional(),
});

export type EventSearchParams = z.infer<typeof eventSearchSchema>;
