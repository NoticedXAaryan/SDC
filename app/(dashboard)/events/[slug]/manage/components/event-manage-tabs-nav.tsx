"use client";

import { TabList, Tab } from "@astryxdesign/core";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function EventManageTabsNav({ currentTab }: { currentTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  return (
    <div className="mb-6 w-full">
      <TabList value={currentTab} onChange={handleTabChange} hasDivider>
        <Tab value="overview" label="Overview" />
        <Tab value="registrations" label="Registrations" />
        <Tab value="sessions" label="Sessions" />
        <Tab value="scanner" label="Scanner" />
        <Tab value="communications" label="Communications" />
        <Tab value="certificates" label="Certificates" />
        <Tab value="settings" label="Settings" />
      </TabList>
    </div>
  );
}
