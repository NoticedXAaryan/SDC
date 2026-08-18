import { z } from "zod";

const announcementLinkSchema = z.string().trim().max(2048).refine(
  (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
  "Link must be an internal path or an HTTP(S) URL",
);

export const createAnnouncementSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(160)
    .refine((value) => !/[\r\n]/.test(value), "Title cannot contain line breaks"),
  message: z.string().trim().min(1, "Message is required").max(10_000),
  link: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    announcementLinkSchema.optional(),
  ),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
