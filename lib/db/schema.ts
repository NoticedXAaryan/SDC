import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum, numeric, real, index, unique, check as drizzleCheck, foreignKey } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import crypto from "crypto";

export const user = pgTable("user", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					name: text("name").notNull(),
					email: text("email").notNull().unique(),
					emailVerified: boolean("emailVerified").notNull(),
					image: text("image"),
					createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
					updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
					
					// Better Auth admin plugin fields
					role: text("role").default("user"),
					banned: boolean("banned").default(false),
					banReason: text("banReason"),
					banExpires: timestamp("banExpires"),
					
					// SDC specific fields
					username: text("username").unique(),
					usernameLower: text("username_lower").unique(),
					displayName: text("display_name"),
					handleChangedAt: timestamp("handle_changed_at"),
					handleChangeCount: integer("handle_change_count").default(0),
					year: integer("year"),
					branch: text("branch"),
					bio: text("bio"),
					skills: jsonb("skills"),
					links: jsonb("links"),
					points: integer("points").default(0),
					level: integer("level").default(1),
					privacy: jsonb("privacy"),
					faceDescriptor: text("faceDescriptor"), // JSON array of 128 floats
    deletedAt: timestamp("deletedAt", { withTimezone: true })
}, (table) => [
	drizzleCheck("role_check", sql`${table.role} IN ('owner', 'admin', 'lead', 'vice_lead', 'event_lead', 'content_lead', 'marketing_lead', 'tech_lead', 'finance_lead', 'volunteer_lead', 'co_lead', 'faculty_coordinator', 'member', 'alumni', 'applicant', 'outsider', 'user')`)
]);

export const session = pgTable("session", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
					token: text("token").notNull().unique(),
					createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
					updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
					ipAddress: text("ipAddress"),
					userAgent: text("userAgent"),
					userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
					impersonatedBy: text("impersonatedBy")
				}, (table) => [index("session_user_id_idx").on(table.userId)]);

export const account = pgTable("account", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					accountId: text("accountId").notNull(),
					providerId: text("providerId").notNull(),
					userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
					accessToken: text("accessToken"),
					refreshToken: text("refreshToken"),
					idToken: text("idToken"),
					accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
					refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
					scope: text("scope"),
					password: text("password"),
					createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
					updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
				}, (table) => [index("account_user_id_idx").on(table.userId)]);

export const verification = pgTable("verification", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					identifier: text("identifier").notNull(),
					value: text("value").notNull(),
					expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
					createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
					updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow()
				});

export const organization = pgTable("organization", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					name: text("name").notNull(),
					slug: text("slug").unique(),
					logo: text("logo"),
					createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
					metadata: text("metadata")
				});

export const member = pgTable("member", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					organizationId: text("organizationId").notNull().references(() => organization.id),
					userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
					role: text("role").notNull(),
					createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
					
					// SDC specific fields
					domain: text("domain")
				}, (table) => [index("member_user_id_idx").on(table.userId)]);

export const invitation = pgTable("invitation", {
					id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
					organizationId: text("organizationId").notNull().references(() => organization.id),
					email: text("email").notNull(),
					role: text("role"),
					status: text("status").notNull(),
					expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
					inviterId: text("inviterId").notNull().references(() => user.id, { onDelete: "cascade" })
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
  createdBy: text("createdBy").notNull().references(() => user.id, { onDelete: "cascade" }), // To be linked to budgets later
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  isInternal: boolean("isInternal").default(false),
  isPaid: boolean("isPaid").default(false),
  price: numeric("price").default("0"),
  hasLimitedSeating: boolean("hasLimitedSeating").default(true),
  seatMap: jsonb("seatMap"),
  
  // AI fields
  aiDraftMessage: text("aiDraftMessage"),
  aiDraftEmail: text("aiDraftEmail"),
    
    // Phase 2 DFD Fields
    parentId: text("parentId"), // Self reference for sub-events
    checklist: jsonb("checklist"), // array of tasks
    staff: jsonb("staff"), // array of assigned members
    forms: jsonb("forms"), // array of form IDs attached
    certificateTemplateId: text("certificateTemplateId"),
  }, (table) => [
    index("events_status_idx").on(table.status), 
    index("events_starts_at_idx").on(table.startsAt), 
    index("events_created_by_idx").on(table.createdBy),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "events_parent_id_fk"
    })
  ]);

export const registrations = pgTable("registrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  status: registrationStatusEnum("status").default("confirmed"),
  passCode: text("passCode").unique().notNull(),
  checkedInAt: timestamp("checkedInAt", { withTimezone: true }),
  checkedOutAt: timestamp("checkedOutAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  attendanceMethod: text("attendanceMethod").default("qr"), // qr, qr+face, manual
  faceMatchDistance: real("faceMatchDistance"),
  needsFaceEnrollment: boolean("needsFaceEnrollment").default(false),
  formResponses: jsonb("formResponses"), // DFD 34: Custom form answers
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date())
}, (t) => [
  index("registrations_event_id_idx").on(t.eventId),
  index("registrations_user_id_idx").on(t.userId),
  unique("registrations_event_user_unq").on(t.eventId, t.userId)
]);

export const eventSessions = pgTable("event_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("startTime", { withTimezone: true }).notNull(),
  endTime: timestamp("endTime", { withTimezone: true }).notNull(),
  location: text("location"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date())
}, (table) => [
  index("event_sessions_event_id_idx").on(table.eventId)
]);

export const sessionAttendance = pgTable("session_attendance", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("sessionId").notNull().references(() => eventSessions.id),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  checkedInAt: timestamp("checkedInAt", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  unique: unique("session_attendance_unq").on(t.sessionId, t.userId),
  sessionIndex: index("session_attendance_session_id_idx").on(t.sessionId)
}));



export const eventInvites = pgTable("event_invites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").default("pending"),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("event_invites_event_id_idx").on(table.eventId)
]);

export const expenseStatusEnum = pgEnum("expense_status", ["pending", "approved", "rejected"]);
export const inventoryActionEnum = pgEnum("inventory_action", ["check_out", "check_in"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done", "blocked"]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("todo"),
  eventId: text("eventId").references(() => events.id, { onDelete: "cascade" }),
  assigneeId: text("assigneeId").references(() => user.id, { onDelete: "cascade" }),
  dueDate: timestamp("dueDate", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => [index("tasks_event_id_idx").on(table.eventId)]);

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  allocated: numeric("allocated").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("budgets_event_id_idx").on(table.eventId)
]);

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  budgetId: text("budgetId").notNull().references(() => budgets.id),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  receiptUrl: text("receiptUrl"),
  status: expenseStatusEnum("status").default("pending"),
  createdBy: text("createdBy").references(() => user.id, { onDelete: "cascade" }),
  approvedBy: text("approvedBy").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("expenses_budget_id_idx").on(table.budgetId)
]);

export const incomes = pgTable("incomes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("incomes_event_id_idx").on(table.eventId)
]);

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  qtyTotal: integer("qtyTotal").notNull(),
  qtyAvailable: integer("qtyAvailable").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date())
});

export const inventoryLogs = pgTable("inventoryLogs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("itemId").notNull().references(() => inventory.id),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  action: inventoryActionEnum("action").notNull(),
  qty: integer("qty").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull()
});

export const submissionStatusEnum = pgEnum("submission_status", ["pending", "approved", "rejected"]);

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  githubUrl: text("githubUrl"),
  liveUrl: text("liveUrl"),
  upvotes: integer("upvotes").default(0),
  status: submissionStatusEnum("status").default("pending"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
});

export const projectMembers = pgTable("project_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  githubUrl: text("githubUrl"),
  twitterUrl: text("twitterUrl"),
});

export const projectImages = pgTable("project_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  url: text("url").notNull(),
  orderIndex: integer("orderIndex").default(0),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  teamMembers: many(projectMembers),
  images: many(projectImages),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, {
    fields: [projectImages.projectId],
    references: [projects.id],
  }),
}));

export const formTemplates = pgTable("form_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cycleName: text("cycleName").unique().notNull(), // Matches applicationCycle
  fields: jsonb("fields").notNull(), // Array of { type, question, options, required }
  isActive: boolean("isActive").default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date())
});

export const applicationStatusEnum = pgEnum("application_status", ["draft", "applied", "ai_graded", "needs_manual_review", "interviewing", "accepted", "rejected"]);

export const applications = pgTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
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
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
}, (t) => [
  index("applications_status_idx").on(t.status),
  unique("applications_user_cycle_unique").on(t.userId, t.applicationCycle)
]);

export const interviews = pgTable("interviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicantId: text("applicantId").notNull().references(() => applications.id, { onDelete: "cascade" }),
  interviewerId: text("interviewerId").notNull().references(() => user.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduledAt", { withTimezone: true }).notNull(),
  meetingLink: text("meetingLink"),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (t) => [
  index("interviews_applicant_id_idx").on(t.applicantId),
  index("interviews_interviewer_id_idx").on(t.interviewerId)
]);

export const pointLogs = pgTable("pointLogs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date())
}, (t) => ({
  index: index("point_logs_user_id_idx").on(t.userId)
}));


export const achievementSubmissions = pgTable("achievement_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proofUrl: text("proofUrl"),
  status: submissionStatusEnum("status").default("pending"),
  pointsAwarded: integer("pointsAwarded").default(0),
  reviewedBy: text("reviewedBy").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("achievement_submissions_user_id_idx").on(t.userId),
  index("achievement_submissions_reviewed_by_idx").on(t.reviewedBy)
]);

export const contentStatusEnum = pgEnum("content_status", ["idea", "drafting", "review", "scheduled", "published"]);

export const contentItems = pgTable("content_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform"), 
  status: contentStatusEnum("status").default("idea"),
  authorId: text("authorId").references(() => user.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduledFor", { withTimezone: true }),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  mediaUrls: jsonb("mediaUrls"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("content_items_author_id_idx").on(t.authorId)]);

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactName: text("contactName"),
  email: text("email"),
  phone: text("phone"),
  category: text("category"),
  rating: integer("rating").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const procurementStatusEnum = pgEnum("procurement_status", ["draft", "pending_quotes", "approval", "approved", "rejected", "completed"]);

export const procurementRequests = pgTable("procurement_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: procurementStatusEnum("status").default("draft"),
  requestedBy: text("requestedBy").notNull().references(() => user.id, { onDelete: "cascade" }),
  eventId: text("eventId").references(() => events.id, { onDelete: "cascade" }),
  estimatedCost: integer("estimatedCost"),
  selectedVendorId: text("selectedVendorId").references(() => vendors.id),
  financeTransactionId: text("financeTransactionId"),
  quotesUrl: text("quotesUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("procurement_requests_requested_by_idx").on(t.requestedBy),
  index("procurement_requests_event_id_idx").on(t.eventId),
  index("procurement_requests_vendor_id_idx").on(t.selectedVendorId)
]);

export const researchPapers = pgTable("researchPapers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  url: text("url"),
  status: submissionStatusEnum("status").default("pending"),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (t) => [index("research_papers_user_id_idx").on(t.userId)]);

export const competitions = pgTable("competitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: text("position").notNull(),
  url: text("url"),
  date: timestamp("date", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
}, (t) => [index("competitions_user_id_idx").on(t.userId)]);

export const auditLogs = pgTable("auditLogs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text("actorId").notNull().references(() => user.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entityId"),
  details: text("details"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull()
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
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date())
}, (table) => [index("notifications_user_id_idx").on(table.userId), index("notifications_read_idx").on(table.read)]);

export const communications = pgTable("communications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("eventId").references(() => events.id, { onDelete: "cascade" }),
  senderId: text("senderId").notNull().references(() => user.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  targetAudience: text("targetAudience").notNull(), // "all", "confirmed", "waitlist"
  status: text("status").default("sent").notNull(),
  sentCount: integer("sentCount").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const clubSettings = pgTable("club_settings", {
  id: text("id").primaryKey().default("default"),
  isFrozen: boolean("isFrozen").default(false).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: text("updatedBy").references(() => user.id, { onDelete: "cascade" }),
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
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const applicationsRelations = relations(applications, ({ one }) => ({
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
  registrations: many(registrations),
  budgets: many(budgets),
  tasks: many(tasks),
  certificates: many(certificates),
}));

export const eventSessionsRelations = relations(eventSessions, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSessions.eventId],
    references: [events.id],
  }),
  attendance: many(sessionAttendance),
}));

// --- Missing relations added below ---

export const userRelations = relations(user, ({ many }) => ({
  registrations: many(registrations),
  applications: many(applications),
  notifications: many(notifications),
  pointLogs: many(pointLogs),
  achievementSubmissions: many(achievementSubmissions),
  certificates: many(certificates),
  auditLogs: many(auditLogs),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  user: one(user, {
    fields: [registrations.userId],
    references: [user.id],
  }),
}));

export const sessionAttendanceRelations = relations(sessionAttendance, ({ one }) => ({
  session: one(eventSessions, {
    fields: [sessionAttendance.sessionId],
    references: [eventSessions.id],
  }),
  user: one(user, {
    fields: [sessionAttendance.userId],
    references: [user.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  event: one(events, {
    fields: [communications.eventId],
    references: [events.id],
  }),
  sender: one(user, {
    fields: [communications.senderId],
    references: [user.id],
  }),
}));



export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicantId],
    references: [applications.id],
  }),
  interviewer: one(user, {
    fields: [interviews.interviewerId],
    references: [user.id],
  }),
}));

export const pointLogsRelations = relations(pointLogs, ({ one }) => ({
  user: one(user, {
    fields: [pointLogs.userId],
    references: [user.id],
  }),
}));

export const achievementSubmissionsRelations = relations(achievementSubmissions, ({ one }) => ({
  user: one(user, {
    fields: [achievementSubmissions.userId],
    references: [user.id],
  }),
  reviewer: one(user, {
    fields: [achievementSubmissions.reviewedBy],
    references: [user.id],
  }),
}));

export const contentItemsRelations = relations(contentItems, ({ one }) => ({
  author: one(user, {
    fields: [contentItems.authorId],
    references: [user.id],
  }),
}));

export const procurementRequestsRelations = relations(procurementRequests, ({ one }) => ({
  requestedByUser: one(user, {
    fields: [procurementRequests.requestedBy],
    references: [user.id],
  }),
  event: one(events, {
    fields: [procurementRequests.eventId],
    references: [events.id],
  }),
  vendor: one(vendors, {
    fields: [procurementRequests.selectedVendorId],
    references: [vendors.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(user, {
    fields: [auditLogs.actorId],
    references: [user.id],
  }),
}));

export const researchPapersRelations = relations(researchPapers, ({ one }) => ({
  user: one(user, {
    fields: [researchPapers.userId],
    references: [user.id],
  }),
}));

export const competitionsRelations = relations(competitions, ({ one }) => ({
  user: one(user, {
    fields: [competitions.userId],
    references: [user.id],
  }),
}));

export const formStatusEnum = pgEnum("form_status", ["draft", "published", "closed", "archived"]);
export const formFieldTypeEnum = pgEnum("field_type", ["short_text", "long_text", "email", "number", "dropdown", "checkbox", "file", "date", "rating", "section_break", "image"]);
export const certStatusEnum = pgEnum("cert_status", ["valid", "revoked", "draft"]);
export const reviewActionEnum = pgEnum("review_action", ["approved", "rejected", "needs_info"]);

export const forms = pgTable("forms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  status: formStatusEnum("status").default("draft"),
  settings: jsonb("settings").notNull().default({ 
    allowExternal: false,
    requireLogin: true,
    allowMultiple: false,
    autoFillProfile: true,
    quotaPerUser: 1,
    quotaPerForm: 1000,
    collegeDomainOnly: true,
    theme: {
      accentColor: "#3b82f6",
      fontFamily: "Inter",
      backgroundImage: null
    },
    thankYouMessage: "Thank you for submitting!",
    redirectUrl: null
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("forms_created_by_idx").on(t.createdBy)]);

export const formFields = pgTable("form_fields", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formId: text("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  type: formFieldTypeEnum("type").notNull(),
  label: text("label").notNull(),
  required: boolean("required").default(false),
  options: jsonb("options"), 
  autoFillKey: text("auto_fill_key"), 
  order: integer("order").notNull(),
  visibilityRules: jsonb("visibility_rules"),
}, (t) => [index("form_fields_form_id_idx").on(t.formId)]);

export const formResponses = pgTable("form_responses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formId: text("form_id").notNull().references(() => forms.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("form_responses_form_id_idx").on(t.formId),
  index("form_responses_user_id_idx").on(t.userId)
]);

export const certTemplates = pgTable("cert_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  backgroundUrl: text("background_url"),
  fields: jsonb("fields").notNull(),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  version: integer("version").default(1),
}, (t) => [
  index("cert_templates_event_id_idx").on(t.eventId),
  index("cert_templates_created_by_idx").on(t.createdBy)
]);

export const certificates = pgTable("certificates_v2", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id").notNull().references(() => certTemplates.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  pdfUrl: text("pdf_url"),
  verifyId: text("verify_id").notNull().unique(),
  status: certStatusEnum("status").default("valid"),
  revokedReason: text("revoked_reason"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),
  issuedBy: text("issued_by").notNull(),
}, (t) => [
  index("certificates_v2_template_id_idx").on(t.templateId),
  index("certificates_v2_user_id_idx").on(t.userId),
  index("certificates_v2_event_id_idx").on(t.eventId)
]);

export const applicationReviews = pgTable("application_reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  action: reviewActionEnum("action").notNull(),
  reasonCode: text("reason_code"),
  reasonNote: text("reason_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("application_reviews_application_id_idx").on(t.applicationId),
  index("application_reviews_reviewer_id_idx").on(t.reviewerId)
]);

export const insights = pgTable("insights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(), // e.g., 'growth', 'engagement', 'finance'
  title: text("title").notNull(),
  description: text("description").notNull(),
  metricValue: text("metric_value"),
  metricTrend: text("metric_trend"), // e.g., '+12%', '-5%'
  isActionable: boolean("is_actionable").default(false),
  actionLink: text("action_link"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});


export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(user, {
    fields: [certificates.userId],
    references: [user.id],
  }),
  event: one(events, {
    fields: [certificates.eventId],
    references: [events.id],
  }),
  template: one(certTemplates, {
    fields: [certificates.templateId],
    references: [certTemplates.id],
  }),
}));

export const applicationReviewsRelations = relations(applicationReviews, ({ one }) => ({
  application: one(applications, {
    fields: [applicationReviews.applicationId],
    references: [applications.id],
  }),
  reviewer: one(user, {
    fields: [applicationReviews.reviewerId],
    references: [user.id],
  }),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  fields: many(formFields),
  responses: many(formResponses),
}));

export const formFieldsRelations = relations(formFields, ({ one }) => ({
  form: one(forms, {
    fields: [formFields.formId],
    references: [forms.id],
  }),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  form: one(forms, {
    fields: [formResponses.formId],
    references: [forms.id],
  }),
  user: one(user, {
    fields: [formResponses.userId],
    references: [user.id],
  }),
}));
