import { requireSession } from "@/lib/dal/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="font-semibold text-lg">STC OS</div>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm font-medium">{session.user.email}</span>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
          <nav className="grid gap-2 text-sm font-medium">
            <a href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 bg-muted text-primary">
              Dashboard
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
