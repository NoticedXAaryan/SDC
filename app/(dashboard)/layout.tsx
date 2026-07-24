import { requireSession } from "@/lib/dal/auth";
import { AppShell } from "@astryxdesign/core";
import { AppSideNav } from "@/components/astryx/app-sidenav";
import { AppTopNav } from "@/components/astryx/app-topnav";
import { AppMobileNav } from "@/components/astryx/app-mobile-nav";
import { DynamicBreadcrumbs } from "@/components/app/breadcrumbs";


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
      sideNav={<AppSideNav role={userRole} />}
      topNav={<AppTopNav user={userProps} />}
      mobileNav={<AppMobileNav role={userRole} user={userProps} />}
      height="fill"
      variant="elevated"
      contentPadding={4}
    >
      <div className="w-full max-w-7xl mx-auto">
        <DynamicBreadcrumbs />
        {children}
      </div>
    </AppShell>
  );
}
