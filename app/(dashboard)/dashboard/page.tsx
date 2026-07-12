import { requireRole } from "@/lib/dal/auth";

export default async function DashboardPage() {
  const { user } = await requireRole(["member", "lead", "co_lead", "admin", "owner", "finance_lead"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to STC OS, {user.name}! Your role is {user.role}.
        </p>
      </div>
    </div>
  );
}
