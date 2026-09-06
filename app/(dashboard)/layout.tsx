import { requirePageSession } from "@/lib/dal/auth";
import { WorkspaceShell } from "@/components/app/workspace-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePageSession();
  return <WorkspaceShell user={{ name: user.name || "Your account", image: user.image, role: user.role || "outsider", emailVerified: user.emailVerified }}>{children}</WorkspaceShell>;
}
