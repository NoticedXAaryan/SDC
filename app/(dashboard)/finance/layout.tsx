import { requireRole } from "@/lib/dal/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["finance_lead", "lead", "vice_lead", "admin", "owner", "faculty_coordinator"]);

  return <>{children}</>;
}
