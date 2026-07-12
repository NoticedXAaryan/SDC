import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, ilike, desc, and, ne } from "drizzle-orm";
import { isManagementRole } from "@/lib/dal/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const isManagement = isManagementRole(session.user.role as string);

    // Filter to only approved members or leads, exclude outsiders and applicants
    const roleFilters = ne(user.role, "applicant");
    
    const conditions = [roleFilters];
    
    // Ensure we also exclude the outsider role from public directory
    conditions.push(ne(user.role, "outsider"));

    if (search) {
      conditions.push(ilike(user.name, `%${search}%`));
    }

    const queryConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Standard public fields
    const columns: any = {
      id: true,
      name: true,
      image: true,
      role: true,
      bio: true,
      skills: true,
      year: true,
      branch: true,
      links: true,
    };

    // If management, include sensitive fields
    if (isManagement) {
      columns.email = true;
    }

    const members = await db.query.user.findMany({
      where: queryConditions,
      orderBy: [desc(user.createdAt)],
      limit,
      offset,
      columns,
    });

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("[Members Directory GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
