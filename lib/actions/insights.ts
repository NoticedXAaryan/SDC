"use server";

import { db } from "@/lib/db";
import { insights, user, events, applications, budgets, expenses } from "@/lib/db/schema";
import { sql, gte, eq, desc, inArray } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal/auth";

export async function generateInsightsAction() {
  try {
    await requireAdmin();
    // 1. Gather rich context data
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(user);
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const [newUsers] = await db.select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, lastWeek));

    const [activeEvents] = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.status, 'published'));
      
    const pendingApps = await db.select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(inArray(applications.status, ["applied", "needs_manual_review"]));
      
    // Finance
    const budgetRows = await db.select({ totalAllocated: sql<number>`coalesce(sum(cast(${budgets.allocated} as numeric)), 0)` }).from(budgets);
    const [approvedExpenseSum] = await db.select({ total: sql<number>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)` }).from(expenses).where(eq(expenses.status, "approved"));
    
    const remainingBudget = Number(budgetRows[0]?.totalAllocated ?? 0) - Number(approvedExpenseSum?.total ?? 0);

    const prompt = `
      You are an expert AI operations co-pilot for a university club. Analyze the following real-time data and provide 3 key, actionable operational insights.
      
      Data:
      - Total Members: ${userCount.count}
      - New Members (last 7 days): ${newUsers.count}
      - Active Published Events: ${activeEvents.count}
      - Pending Applications to Review: ${pendingApps[0]?.count ?? 0}
      - Remaining Club Budget: ₹${remainingBudget}
      
      Return a JSON array of exactly 3 objects with the following schema:
      [
        {
          "category": "growth" | "engagement" | "events" | "finance" | "operations",
          "title": "Short title (e.g. Budget Running Low)",
          "description": "1-2 sentence explanation of why this matters and what to do",
          "metricValue": "e.g. ₹5,000 or 12 pending",
          "metricTrend": "e.g. -15% or Critical",
          "isActionable": boolean,
          "actionLink": "URL path (e.g. /admin/finance or /admin/members)"
        }
      ]
    `;

    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
    });
    
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

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to generate insights:", error);
    return { error: "Failed to generate insights" };
  }
}

export async function deleteInsightAction(id: string) {
  try {
    await requireAdmin();
    await db.delete(insights).where(eq(insights.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to dismiss insight" };
  }
}
