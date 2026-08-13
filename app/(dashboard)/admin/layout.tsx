import { getCurrentUser, ADMIN_ROLES } from "@/lib/dal/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  
  if (!session.user.role || !ADMIN_ROLES.includes(session.user.role as any)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
