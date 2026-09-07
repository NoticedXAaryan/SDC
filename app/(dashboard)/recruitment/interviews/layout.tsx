import { requirePageSession, isManagementRole } from "@/lib/dal/auth";
import { redirect } from "next/navigation";
export default async function InterviewManagementLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePageSession("/recruitment/interviews");
  if (!isManagementRole(user.role)) redirect("/dashboard");
  return <>{children}</>;
}
