CREATE TABLE "form_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"cycleName" text NOT NULL,
	"fields" jsonb NOT NULL,
	"isActive" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "form_templates_cycleName_unique" UNIQUE("cycleName")
);
