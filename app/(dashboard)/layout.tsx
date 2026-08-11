import { requireSession } from "@/lib/dal/auth";
import { AppShell } from "@astryxdesign/core";
import { AppSideNav } from "@/components/astryx/app-sidenav";

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
      contentPadding={4}
    >
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        <DynamicBreadcrumbs />
        <CommandMenu />
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
