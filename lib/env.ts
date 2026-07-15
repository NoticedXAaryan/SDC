import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),
    REDIS_HOST: z.string().optional().default("localhost"),
    REDIS_PORT: z.string().optional().default("6379"),
    RESEND_API_KEY: z.string().optional().or(z.literal("")),
    EMAIL_FROM_ADDRESS: z.string().email().optional().or(z.literal("")),
    EMAIL_FROM_NAME: z.string().optional().or(z.literal("")),
    OPENROUTER_API_KEY: z.string().optional().or(z.literal("")),
    GOOGLE_CLIENT_ID: z.string().optional().or(z.literal("")),
    GOOGLE_CLIENT_SECRET: z.string().optional().or(z.literal("")),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    PASS_SECRET: z.string().min(1),
    ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
    ADMIN_NAME: z.string().optional().default("System Admin"),
    GITHUB_TOKEN: z.string().optional().or(z.literal("")),
    GITHUB_REPO: z.string().optional().or(z.literal("")),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().or(z.literal("")),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().or(z.literal("")),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
