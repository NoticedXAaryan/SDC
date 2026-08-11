"use client";

import { TabList, Tab, Badge } from "@astryxdesign/core";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function ApprovalTabsNav({ 
  currentTab,
  eventsCount,
  procurementsCount,
}: { 
  currentTab: string,
  eventsCount: number,
  procurementsCount: number,
}) {
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
        <Tab 
          value="events" 
          label="Events" 
          endContent={eventsCount > 0 ? <Badge label={eventsCount.toString()} variant="neutral" /> : undefined} 
        />
        <Tab 
          value="procurement" 
          label="Procurement" 
          endContent={procurementsCount > 0 ? <Badge label={procurementsCount.toString()} variant="neutral" /> : undefined} 
        />
        <Tab value="roles" label="Role Changes" />
      </TabList>
    </div>
  );
}
