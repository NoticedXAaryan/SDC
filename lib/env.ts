import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),
    REDIS_HOST: z.string().optional().default("localhost"),
    REDIS_PORT: z.string().optional().default("6379"),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM_ADDRESS: z.string().email().optional(),
    EMAIL_FROM_NAME: z.string().min(1).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    PASS_SECRET: z.string().min(1).default("default_dev_secret_please_change_in_prod"),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(1).optional(),
    ADMIN_NAME: z.string().optional().default("System Admin"),
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_REPO: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
