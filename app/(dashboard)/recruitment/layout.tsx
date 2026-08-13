import { getCurrentUser, MANAGEMENT_ROLES } from "@/lib/dal/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  
  if (!session.user.role || !MANAGEMENT_ROLES.includes(session.user.role as any)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
