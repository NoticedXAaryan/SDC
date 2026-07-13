import { z } from "zod";

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
);

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventBaseSchema.partial().extend({
  status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
});

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
