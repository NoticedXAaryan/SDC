"use client";
import { useState } from "react";
import { MemberTable } from "@/components/admin/member-table";
import { OrgChart } from "@/components/admin/org-chart";

export function OrgChartTabs({ membersProps, orgChartData }: any) {
  const [tab, setTab] = useState<"directory"|"orgchart">("directory");
  
  return (
    <div className="space-y-6 pt-4">
      <div className="flex gap-2 border-b border-border">
        <button 
          onClick={() => setTab("directory")}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${tab === "directory" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Member Directory
        </button>
        <button 
          onClick={() => setTab("orgchart")}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${tab === "orgchart" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Leadership Org Chart
        </button>
      </div>

      {tab === "directory" ? (
        <MemberTable {...membersProps} />
      ) : (
        <OrgChart data={orgChartData} />
      )}
    </div>
  );
}
