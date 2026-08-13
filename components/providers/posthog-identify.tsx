"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client"; // Assuming standard better-auth client setup

export function PostHogIdentify() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      });
    } else if (!isPending && !session) {
      posthog.reset();
    }
  }, [session, isPending]);

  return null;
}
