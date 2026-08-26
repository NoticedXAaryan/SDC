import { requireSession } from "@/lib/dal/auth";
import { AppShell } from "@astryxdesign/core";
import { AppSideNav } from "@/components/astryx/app-sidenav";
import { AppTopNav } from "@/components/astryx/app-topnav";
import { AppMobileNav } from "@/components/astryx/app-mobile-nav";
import { DynamicBreadcrumbs } from "@/components/app/breadcrumbs";
import { CommandMenu } from "@/components/app/command-menu";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const userRole = (session.user.role || "user") as string;
  
  const userProps = {
    name: session.user.name || "User",
    image: session.user.image,
    role: userRole,
  };

  return (
    <AppShell
      sideNav={<AppSideNav role={userRole} user={userProps} />}
      mobileNav={<AppMobileNav role={userRole} user={userProps} />}
      height="fill"
      variant="elevated"
      contentPadding={0}
    >
      <div className="dashboard-canvas flex min-h-full w-full flex-col">
        <AppTopNav />
        <main id="main-content" className="dashboard-content flex-1" tabIndex={-1}>
          <div className="mb-4 hidden sm:block">
            <DynamicBreadcrumbs />
          </div>
          <CommandMenu />
          {children}
        </main>
      </div>
    </AppShell>
  );
}
