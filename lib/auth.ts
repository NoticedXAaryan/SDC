import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, username } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { normalizeUsername, usernameError } from "./username-policy";
import { admin } from "better-auth/plugins/admin";
import { defaultAc, adminAc, userAc } from "better-auth/plugins/admin/access";
import { db } from "./db";
import * as schema from "./db/schema";
import { Mailer } from "./services/mailer";
import { SIGNUP_ROLE, hasEmailDelivery } from "./auth-policy";

/**
 * SDC roles (ordered by privilege):
 * - owner: Full system control, cannot be demoted if last owner
 * - admin: Near-full access, can manage members/events/finance
 * - lead: Domain lead, can manage own domain's events/members
 * - co_lead: Assists lead, can draft events
 * - finance_lead: Budget/expense/inventory management
 * - member: Standard authenticated user
 * - alumni: Graduated member, read-only + certificates
 *
 * Better Auth's admin plugin manages the `role` column on the user table.
 * Every public signup starts as an outsider. Club membership is approved
 * through recruitment; owners are provisioned using the operator CLI.
 * The `adminRoles` are ["owner", "admin"] — these can access admin endpoints.
 */

// Define SDC-specific role permissions using Better Auth's access control system.
// The admin plugin requires all roles referenced in adminRoles to exist in this map.
const ownerRole = defaultAc.newRole({
    user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "set-email", "get", "update"],
    session: ["list", "revoke", "delete"],
});

const leadRole = defaultAc.newRole({
    user: ["list", "get"],
    session: [],
});

const viceLeadRole = defaultAc.newRole({
    user: ["list", "get"], // Recruitment decisions use the audited application service.
    session: [],
});

const domainLeadRole = defaultAc.newRole({
    user: ["list", "get"], // Major Leads can view members
    session: [],
});

const coLeadRole = defaultAc.newRole({
    user: ["list", "get"], // Draft only by default
    session: [],
});

const facultyCoordinatorRole = defaultAc.newRole({
    user: ["list", "get"], // Oversight only
    session: [],
});

const applicantRole = defaultAc.newRole({
    user: [],
    session: [],
});

const memberRole = defaultAc.newRole({
    user: [],
    session: [],
});

const alumniRole = defaultAc.newRole({
    user: [],
    session: [],
});

const outsiderRole = defaultAc.newRole({
    user: [],
    session: [],
});

export const auth = betterAuth({
    // Role/profile changes use the club's audited APIs, which protect executive accounts.
    disabledPaths: ["/is-username-available", "/sign-in/username", "/admin/set-role", "/admin/update-user"],
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            // Profile edits must use the audited endpoint with its cooldown and row lock.
            if (ctx.path === "/update-user" && ctx.body && "username" in ctx.body) {
                throw new APIError("BAD_REQUEST", { message: "Change your username in Settings." });
            }
        }),
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const email = user.email.toLowerCase().trim();
                    
                    // The disposable-email-domains package exports an array directly as default
                    const disposableList = (await import("disposable-email-domains")).default || await import("disposable-email-domains");
                    
                    const isBad = Array.isArray(disposableList) 
                        ? disposableList.includes(email.split('@')[1]) 
                        : false;

                    if (isBad) {
                        throw new Error("Use your college email or personal Gmail, disposable emails blocked");
                    }

                    return {
                        data: {
                            ...user,
                            email,
                            ...("username" in user && typeof user.username === "string"
                                ? { usernameLower: normalizeUsername(user.username), handleChangedAt: new Date() } : {}),
                            role: SIGNUP_ROLE,
                            points: 0,
                            level: 1,
                        }
                    };
                }
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // UI handles verification banner
        autoSignIn: true,
        minPasswordLength: 8,
        sendResetPassword: async ({ user, url }, request) => {
            await Mailer.sendPasswordReset(user.email, url);
        }
    },
    emailVerification: {
        sendOnSignUp: hasEmailDelivery(process.env),
        autoSignInAfterVerification: true,
        expiresIn: 3600,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            await Mailer.sendEmailVerification(user.email, url);
        }
    },
    socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            }
        } : {})
    },
    user: {
        additionalFields: {
            usernameLower: { type: "string", required: false, input: false, returned: false },
            handleChangedAt: { type: "date", required: false, input: false, returned: false },
            onboardingCompleted: { type: "boolean", defaultValue: false, input: false },
            membershipWelcomeSeen: { type: "boolean", defaultValue: false, input: false, returned: false },
            year: { type: "number", required: false },
            branch: { type: "string", required: false },
            bio: { type: "string", required: false },
            skills: { type: "string", required: false }, 
            links: { type: "string", required: false },  
            points: { type: "number", required: false, defaultValue: 0, input: false },
            level: { type: "number", required: false, defaultValue: 1, input: false },
            role: { type: "string", required: true, defaultValue: "outsider", input: false }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60,               // update every 60s
        cookieCache: { enabled: true, maxAge: 60 }
    },
    advanced: {
        cookiePrefix: "sdc",
        useSecureCookies: process.env.NODE_ENV === "production"
    },
    plugins: [
        username({
            displayUsername: false,
            minUsernameLength: 3,
            maxUsernameLength: 20,
            usernameNormalization: normalizeUsername,
            usernameValidator: value => !usernameError(value),
            validationOrder: { username: "post-normalization" },
        }),
        organization({
            // SDC domains/teams as organizations/roles
        }),
        admin({
            defaultRole: SIGNUP_ROLE,
            adminRoles: ["owner", "admin"],
            roles: {
                owner: ownerRole,
                admin: adminAc,
                lead: leadRole,
                vice_lead: viceLeadRole,
                event_lead: domainLeadRole,
                content_lead: domainLeadRole,
                marketing_lead: domainLeadRole,
                tech_lead: domainLeadRole,
                finance_lead: domainLeadRole,
                volunteer_lead: domainLeadRole,
                co_lead: coLeadRole,
                faculty_coordinator: facultyCoordinatorRole,
                member: memberRole,
                alumni: alumniRole,
                applicant: applicantRole,
                outsider: outsiderRole,
            },
        }),
    ],
});
