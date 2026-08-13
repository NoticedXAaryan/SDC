import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { generateObject } from "ai";
import { defaultModel } from "@/lib/ai";
import { withApiHandler } from "@/lib/api-wrapper";

const draftSchema = z.object({
  topic: z.string().min(3),
  platform: z.enum(["twitter", "linkedin", "instagram", "blog"]),
});

const contentSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await requireRole(["content_lead", "co_lead", "lead", "admin", "owner"]);

  const body = await req.json();
  const parsed = draftSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error }, { status: 400 });
  }

  const { topic, platform } = parsed.data;

  const prompt = `You are a social media manager for a technical student club. 
Draft an engaging post for ${platform} about: "${topic}".
Provide a catchy title and the main post description (body). Include relevant hashtags.`;

  const { object } = await generateObject({
    model: defaultModel,
    schema: contentSchema,
    prompt,
  });

  return NextResponse.json(object);
});
