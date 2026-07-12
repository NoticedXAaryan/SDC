import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { MemberTable } from "@/components/admin/member-table";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await requireAdmin();

  // Get initial data server-side
  const members = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    username: user.username,
    year: user.year,
    branch: user.branch,
    points: user.points,
    level: user.level,
    banned: user.banned,
    createdAt: user.createdAt,
    image: user.image,
  })
  .from(user)
  .orderBy(desc(user.createdAt))
  .limit(20);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(user);
  const total = Number(countResult[0]?.count ?? 0);

  // Role distribution stats
  const roleStats = await db.select({
    role: user.role,
    count: sql<number>`count(*)`,
  })
  .from(user)
  .groupBy(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Member Management</h1>
        <p className="text-muted-foreground">
          Manage {total} club members. Search, filter, and update roles.
        </p>
      </div>

      {/* Role distribution */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {roleStats.map((stat) => (
          <div key={stat.role} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="text-sm font-medium text-muted-foreground capitalize">{stat.role || "unset"}</div>
            <div className="text-2xl font-bold mt-1">{Number(stat.count)}</div>
          </div>
        ))}
      </div>

      {/* Member table */}
      <MemberTable 
        initialMembers={members} 
        total={total}
        currentUserRole={session.user.role}
        currentUserId={session.user.id}
      />
    </div>
  );
}
