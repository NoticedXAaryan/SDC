import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, numeric, real, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import crypto from "crypto";

export const user = pgTable("user", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					name: text("name").notNull(),
					email: text("email").notNull().unique(),
					emailVerified: boolean("emailVerified").notNull(),
					image: text("image"),
					createdAt: timestamp("createdAt").notNull(),
					updatedAt: timestamp("updatedAt").notNull(),
					
					// Better Auth admin plugin fields
					role: text("role").default("user"),
					banned: boolean("banned").default(false),
					banReason: text("banReason"),
					banExpires: timestamp("banExpires"),
					
					// SDC specific fields
					username: text("username").unique(),
					year: integer("year"),
					branch: text("branch"),
					bio: text("bio"),
					skills: jsonb("skills"),
					links: jsonb("links"),
					points: integer("points").default(0),
					level: integer("level").default(1),
					privacy: jsonb("privacy"),
    deletedAt: timestamp("deletedAt")
});

export const session = pgTable("session", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					expiresAt: timestamp("expiresAt").notNull(),
					token: text("token").notNull().unique(),
					createdAt: timestamp("createdAt").notNull(),
					updatedAt: timestamp("updatedAt").notNull(),
					ipAddress: text("ipAddress"),
					userAgent: text("userAgent"),
					userId: text("userId").notNull().references(() => user.id),
					impersonatedBy: text("impersonatedBy")
				}, (table) => [index("session_user_id_idx").on(table.userId)]);

export const account = pgTable("account", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					accountId: text("accountId").notNull(),
					providerId: text("providerId").notNull(),
					userId: text("userId").notNull().references(() => user.id),
					accessToken: text("accessToken"),
					refreshToken: text("refreshToken"),
					idToken: text("idToken"),
					accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
					refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
					scope: text("scope"),
					password: text("password"),
					createdAt: timestamp("createdAt").notNull(),
					updatedAt: timestamp("updatedAt").notNull()
				}, (table) => [index("account_user_id_idx").on(table.userId)]);

export const verification = pgTable("verification", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					identifier: text("identifier").notNull(),
					value: text("value").notNull(),
					expiresAt: timestamp("expiresAt").notNull(),
					createdAt: timestamp("createdAt"),
					updatedAt: timestamp("updatedAt")
				});

export const organization = pgTable("organization", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					name: text("name").notNull(),
					slug: text("slug").unique(),
					logo: text("logo"),
					createdAt: timestamp("createdAt").notNull(),
					metadata: text("metadata")
				});

export const member = pgTable("member", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					organizationId: text("organizationId").notNull().references(() => organization.id),
					userId: text("userId").notNull().references(() => user.id),
					role: text("role").notNull(),
					createdAt: timestamp("createdAt").notNull(),
					
					// SDC specific fields
					domain: text("domain")
				}, (table) => [index("member_user_id_idx").on(table.userId)]);

export const invitation = pgTable("invitation", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					organizationId: text("organizationId").notNull().references(() => organization.id),
					email: text("email").notNull(),
					role: text("role"),
					status: text("status").notNull(),
					expiresAt: timestamp("expiresAt").notNull(),
					inviterId: text("inviterId").notNull().references(() => user.id)
				});

export const eventTypeEnum = pgEnum("event_type", ["hackathon", "workshop", "seminar", "social", "competition"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "cancelled", "completed"]);
export const eventVisibilityEnum = pgEnum("event_visibility", ["public", "private", "unlisted", "members_only", "invite_only"]);
export const registrationStatusEnum = pgEnum("registration_status", ["confirmed", "waitlist", "checked_in", "cancelled", "no_show"]);

export const events = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  type: eventTypeEnum("type").default("workshop"),
  domain: text("domain"),
  description: text("description"),
  coverImage: text("coverImage"),
  location: text("location"),
  capacity: integer("capacity").default(50),
  status: eventStatusEnum("status").default("draft"),
  startsAt: timestamp("startsAt", { withTimezone: true }).notNull(),
  endsAt: timestamp("endsAt", { withTimezone: true }),
  registrationDeadline: timestamp("registrationDeadline", { withTimezone: true }),
  visibility: eventVisibilityEnum("visibility").default("public"),
  createdBy: text("createdBy").notNull().references(() => user.id), // To be linked to budgets later
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  isInternal: boolean("isInternal").default(false),
  
  // v2 fields
  isPaid: boolean("isPaid").default(false),
  price: numeric("price").default("0"),
  hasLimitedSeating: boolean("hasLimitedSeating").default(true),
  seatMap: jsonb("seatMap"),
  
  // AI fields
  aiDraftMessage: text("aiDraftMessage"),
  aiDraftEmail: text("aiDraftEmail"),
}, (table) => [index("events_status_idx").on(table.status), index("events_starts_at_idx").on(table.startsAt), index("events_created_by_idx").on(table.createdBy)]);

export const registrations = pgTable("registrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id),
  userId: text("userId").notNull().references(() => user.id),
  status: registrationStatusEnum("status").default("confirmed"),
  passCode: text("passCode").unique().notNull(),
  checkedInAt: timestamp("checkedInAt", { withTimezone: true }),
  checkedOutAt: timestamp("checkedOutAt", { withTimezone: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  
  // v2 fields
  attendanceMethod: text("attendanceMethod").default("qr"), // qr, qr+face, manual
  faceMatchDistance: real("faceMatchDistance"),
  needsFaceEnrollment: boolean("needsFaceEnrollment").default(false),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
}, (t) => [
  index("registrations_event_id_idx").on(t.eventId),
  index("registrations_user_id_idx").on(t.userId),
  unique("registrations_event_user_unq").on(t.eventId, t.userId)
]);

export const eventSessions = pgTable("event_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("startTime", { withTimezone: true }).notNull(),
  endTime: timestamp("endTime", { withTimezone: true }).notNull(),
  location: text("location"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
});

export const sessionAttendance = pgTable("session_attendance", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("sessionId").notNull().references(() => eventSessions.id),
  userId: text("userId").notNull().references(() => user.id),
  checkedInAt: timestamp("checkedInAt", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  unique: unique("session_attendance_unq").on(t.sessionId, t.userId)
}));

export const certificateTemplates = pgTable("certificateTemplates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  basePdf: text("basePdf").notNull(),
  schemas: jsonb("schemas").notNull(), // pdfme fields JSON
  createdBy: text("createdBy").notNull().references(() => user.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  verifyCode: text("verifyCode").unique().notNull(), // nanoid(12)
  userId: text("userId").notNull().references(() => user.id),
  eventId: text("eventId").references(() => events.id),
  templateId: text("templateId").notNull().references(() => certificateTemplates.id),
  pdfUrl: text("pdfUrl").notNull(),
  hash: text("hash").notNull(), // SHA256 of PDF buffer
  revoked: boolean("revoked").default(false),
  revokedReason: text("revokedReason"),
  issuedBy: text("issuedBy").notNull().references(() => user.id),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
}, (table) => [index("certificates_user_id_idx").on(table.userId)]);

export const eventInvites = pgTable("event_invites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id),
  userId: text("userId").references(() => user.id),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const expenseStatusEnum = pgEnum("expense_status", ["pending", "approved", "rejected"]);
export const inventoryActionEnum = pgEnum("inventory_action", ["check_out", "check_in"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done", "blocked"]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("todo"),
  eventId: text("eventId").references(() => events.id),
  assigneeId: text("assigneeId").references(() => user.id),
  dueDate: timestamp("dueDate", { withTimezone: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => [index("tasks_event_id_idx").on(table.eventId)]);

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id),
  allocated: numeric("allocated").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  budgetId: text("budgetId").notNull().references(() => budgets.id),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  receiptUrl: text("receiptUrl"),
  status: expenseStatusEnum("status").default("pending"),
  createdBy: text("createdBy").references(() => user.id),
  approvedBy: text("approvedBy").references(() => user.id),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const incomes = pgTable("incomes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id),
  amount: numeric("amount").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  qtyTotal: integer("qtyTotal").notNull(),
  qtyAvailable: integer("qtyAvailable").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
});

export const inventoryLogs = pgTable("inventoryLogs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("itemId").notNull().references(() => inventory.id),
  userId: text("userId").notNull().references(() => user.id),
  action: inventoryActionEnum("action").notNull(),
  qty: integer("qty").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const submissionStatusEnum = pgEnum("submission_status", ["pending", "approved", "rejected"]);

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  githubUrl: text("githubUrl"),
  liveUrl: text("liveUrl"),
  teamMembers: jsonb("teamMembers"), // array of { name, role, github, twitter }
  images: jsonb("images"), // array of urls
  upvotes: integer("upvotes").default(0),
  status: submissionStatusEnum("status").default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const formTemplates = pgTable("form_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cycleName: text("cycleName").unique().notNull(), // Matches applicationCycle
  fields: jsonb("fields").notNull(), // Array of { type, question, options, required }
  isActive: boolean("isActive").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
});

export const applicationStatusEnum = pgEnum("application_status", ["draft", "applied", "ai_graded", "needs_manual_review", "interviewing", "accepted", "rejected"]);

export const applications = pgTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id),
  applicationCycle: text("applicationCycle").notNull(),
  status: applicationStatusEnum("status").default("applied"),
  answers: jsonb("answers"),
  linkedinUrl: text("linkedinUrl"),
  githubUrl: text("githubUrl"),
  portfolioUrl: text("portfolioUrl"),
  resumeUrl: text("resumeUrl"),
  skills: jsonb("skills"),
  teamPreference: text("teamPreference"),
  whyJoin: text("whyJoin"),
  priorExperience: text("priorExperience"),
  availability: text("availability"),
  aiScore: integer("aiScore"),
  aiFeedback: text("aiFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (t) => [
  index("applications_status_idx").on(t.status),
  unique("applications_user_cycle_unique").on(t.userId, t.applicationCycle)
]);

export const interviews = pgTable("interviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicantId: text("applicantId").notNull().references(() => applications.id),
  interviewerId: text("interviewerId").notNull().references(() => user.id),
  scheduledAt: timestamp("scheduledAt", { withTimezone: true }).notNull(),
  meetingLink: text("meetingLink"),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const pointLogs = pgTable("pointLogs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
}, (t) => ({
  index: index("point_logs_user_id_idx").on(t.userId)
}));


export const achievementSubmissions = pgTable("achievement_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proofUrl: text("proofUrl"),
  status: submissionStatusEnum("status").default("pending"),
  pointsAwarded: integer("pointsAwarded").default(0),
  reviewedBy: text("reviewedBy").references(() => user.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const contentStatusEnum = pgEnum("content_status", ["idea", "drafting", "review", "scheduled", "published"]);

export const contentItems = pgTable("content_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform"), 
  status: contentStatusEnum("status").default("idea"),
  authorId: text("authorId").references(() => user.id),
  scheduledFor: timestamp("scheduledFor", { withTimezone: true }),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  mediaUrls: jsonb("mediaUrls"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactName: text("contactName"),
  email: text("email"),
  phone: text("phone"),
  category: text("category"),
  rating: integer("rating").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const procurementStatusEnum = pgEnum("procurement_status", ["draft", "pending_quotes", "approval", "approved", "rejected", "completed"]);

export const procurementRequests = pgTable("procurement_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: procurementStatusEnum("status").default("draft"),
  requestedBy: text("requestedBy").notNull().references(() => user.id),
  eventId: text("eventId").references(() => events.id),
  estimatedCost: integer("estimatedCost"),
  selectedVendorId: text("selectedVendorId").references(() => vendors.id),
  financeTransactionId: text("financeTransactionId"),
  quotesUrl: text("quotesUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const researchPapers = pgTable("researchPapers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  url: text("url"),
  status: submissionStatusEnum("status").default("pending"),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const competitions = pgTable("competitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id),
  title: text("title").notNull(),
  position: text("position").notNull(),
  url: text("url"),
  date: timestamp("date", { withTimezone: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

export const auditLogs = pgTable("auditLogs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text("actorId").notNull().references(() => user.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entityId"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull()
}, (t) => [
  index("audit_logs_actor_time_idx").on(t.actorId, t.timestamp)
]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date())
}, (table) => [index("notifications_user_id_idx").on(table.userId), index("notifications_read_idx").on(table.read)]);

export const clubSettings = pgTable("club_settings", {
  id: text("id").primaryKey().default("default"),
  isFrozen: boolean("isFrozen").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  updatedBy: text("updatedBy").references(() => user.id),
});

export const aiLogStatusEnum = pgEnum("ai_log_status", ["success", "failed"]);

export const aiLogs = pgTable("ai_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prompt: text("prompt").notNull(),
  response: text("response"),
  latencyMs: integer("latencyMs"),
  modelUsed: text("modelUsed").default("openrouter/free"),
  status: aiLogStatusEnum("status").default("success"),
  entityId: text("entityId"),
  entityType: text("entityType"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(user, {
    fields: [applications.userId],
    references: [user.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  budget: one(budgets, {
    fields: [expenses.budgetId],
    references: [budgets.id],
  }),
  createdBy: one(user, {
    fields: [expenses.createdBy],
    references: [user.id],
  }),
  approvedBy: one(user, {
    fields: [expenses.approvedBy],
    references: [user.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  event: one(events, {
    fields: [budgets.eventId],
    references: [events.id],
  }),
  expenses: many(expenses),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  event: one(events, {
    fields: [incomes.eventId],
    references: [events.id],
  }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  item: one(inventory, {
    fields: [inventoryLogs.itemId],
    references: [inventory.id],
  }),
  user: one(user, {
    fields: [inventoryLogs.userId],
    references: [user.id],
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  sessions: many(eventSessions),
  incomes: many(incomes),
}));

export const eventSessionsRelations = relations(eventSessions, ({ one }) => ({
  event: one(events, {
    fields: [eventSessions.eventId],
    references: [events.id],
  }),
}));
