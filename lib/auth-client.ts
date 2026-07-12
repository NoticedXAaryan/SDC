import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
    plugins: [
        organizationClient(),
        adminClient(),
        inferAdditionalFields<typeof auth>(),
    ]
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;

