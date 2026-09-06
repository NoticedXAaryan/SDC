import { z } from "zod";

const optionalUrl = z.union([z.string().trim().url(), z.literal("")]).optional();

export const createProjectSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(5000),
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  teamMembers: z.array(z.object({
    name: z.string().trim().min(2).max(120),
    role: z.string().trim().min(2).max(120),
    githubUrl: optionalUrl,
    twitterUrl: optionalUrl,
  })).max(30).default([]),
  images: z.array(z.string().url()).max(12).default([]),
});

export const reviewProjectSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reasonCode: z.string().trim().max(100).optional(),
  reasonNote: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.status === "rejected" && !value.reasonCode) {
    context.addIssue({ code: "custom", path: ["reasonCode"], message: "A rejection reason is required" });
  }
});
