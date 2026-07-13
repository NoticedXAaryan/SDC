import { requireLead } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireLead();

    const allApplications = await db
      .select({
        id: applications.id,
        status: applications.status,
        applicationCycle: applications.applicationCycle,
        aiScore: applications.aiScore,
        aiFeedback: applications.aiFeedback,
        answers: applications.answers,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        userName: user.name,
        userEmail: user.email,
        userUsername: user.username,
      })
      .from(applications)
      .innerJoin(user, eq(applications.userId, user.id));

    // Flatten the answers and structure the data for CSV
    const csvData = allApplications.map((app) => {
      const answers: Record<string, any> = (app.answers as Record<string, any>) || {};
      
      return {
        "Application ID": app.id,
        "Name": app.userName,
        "Email": app.userEmail,
        "Username": app.userUsername || "",
        "Cycle": app.applicationCycle,
        "Status": app.status,
        "AI Score": app.aiScore ?? "",
        "AI Feedback": app.aiFeedback ?? "",
        "Applied At": app.createdAt?.toISOString() || "",
        "Updated At": app.updatedAt?.toISOString() || "",
        // Merge arbitrary answers in
        ...answers
      };
    });

    const csv = Papa.unparse(csvData);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="applications_export.csv"',
      },
    });
  } catch (error: any) {
    console.error("CSV Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
