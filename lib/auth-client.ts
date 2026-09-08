import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
    plugins: [
        usernameClient({ displayUsername: false }),
        organizationClient(),
        adminClient(),
        inferAdditionalFields<typeof auth>(),
    ]
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;
