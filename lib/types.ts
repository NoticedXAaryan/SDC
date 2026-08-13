import { InferSelectModel } from "drizzle-orm";
import * as schema from "./db/schema";

export type User = InferSelectModel<typeof schema.user>;
export type Event = InferSelectModel<typeof schema.events>;
export type CertificateTemplate = InferSelectModel<typeof schema.certTemplates>;
export type Certificate = InferSelectModel<typeof schema.certificates>;
export type Form = InferSelectModel<typeof schema.forms>;
export type FormResponse = InferSelectModel<typeof schema.formResponses>;
export type Budget = InferSelectModel<typeof schema.budgets>;
export type Expense = InferSelectModel<typeof schema.expenses>;
export type Project = InferSelectModel<typeof schema.projects>;
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type Inventory = InferSelectModel<typeof schema.inventory>;
export type Application = InferSelectModel<typeof schema.applications>;
export type Notification = InferSelectModel<typeof schema.notifications>;

// Some APIs join data or return subsets. Let's define some UI response types.
export type EventWithStats = Event & {
  stats?: {
    totalRegistrations: number;
    checkedIn: number;
    revenue: number;
  };
};

export type LeaderboardUser = User & { rank?: number };
