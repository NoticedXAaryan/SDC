import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, events, insights, registrations } from "@/lib/db/schema";
import { sql, gte, desc } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // In a real scenario, protect this endpoint via a secret header or allow only local cron triggers
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Gather basic stats for the prompt
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
  
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const [newUsers] = await db.select({ count: sql<number>`count(*)` })
    .from(user)
    .where(gte(user.createdAt, lastWeek));

  const [activeEvents] = await db.select({ count: sql<number>`count(*)` })
    .from(events)
    .where(sql`${events.status} = 'published'`);

  const prompt = `
    Analyze the following club data and provide 3 key insights.
    Data:
    - Total Users: ${userCount.count}
    - New Users (last 7 days): ${newUsers.count}
    - Active Events: ${activeEvents.count}
    
    Return a JSON array of objects with the following schema:
    [
      {
        "category": "growth" | "engagement" | "events",
        "title": "Short title",
        "description": "1 sentence explanation",
        "metricValue": "e.g. 150",
        "metricTrend": "e.g. +5%",
        "isActionable": boolean,
        "actionLink": "/some-url"
      }
    ]
  `;

  try {
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
    });
    
    // Parse JSON from text
    const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || "[]";
    const newInsights = JSON.parse(jsonStr);
    
    // Clear old insights and insert new
    await db.delete(insights);
    
    if (newInsights.length > 0) {
      await db.insert(insights).values(newInsights.map((i: any) => ({
        category: i.category,
        title: i.title,
        description: i.description,
        metricValue: String(i.metricValue),
        metricTrend: String(i.metricTrend),
        isActionable: i.isActionable,
        actionLink: i.actionLink,
      })));
    }

    return NextResponse.json({ success: true, insights: newInsights });
  } catch (error) {
    console.error("Failed to generate insights:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
