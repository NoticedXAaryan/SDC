import { requirePageSession } from "@/lib/dal/auth";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import { db } from "@/lib/db";
import { user as users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession();
  const [account] = await db.select({ role: users.role, name: users.name, image: users.image, emailVerified: users.emailVerified }).from(users).where(eq(users.id, session.user.id));
  const user = account || session.user;
  return <WorkspaceShell user={{ name: user.name || "Your account", image: user.image, role: user.role || "outsider", emailVerified: user.emailVerified }}>{children}</WorkspaceShell>;
}
