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
      contentPadding={0} // We pad internally
    >
      <div className="flex flex-col min-h-full w-full">
        <AppTopNav />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
          <div className="mb-4 sm:mb-6">
            <DynamicBreadcrumbs />
          </div>
          <CommandMenu />
          {children}
        </div>
      </div>
    </AppShell>
  );
}
