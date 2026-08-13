import React from "react";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";

export function OrgChart({ data }: { data: any[] }) {
  const getByRole = (roleKeys: string[]) => data.filter(u => roleKeys.includes(u.role));

  const faculty = getByRole(["faculty_coordinator"]);
  const owners = getByRole(["owner"]);
  const admins = getByRole(["admin"]);
  const viceLeads = getByRole(["vice_lead"]);
  const leads = getByRole(["lead", "event_lead", "content_lead", "marketing_lead", "tech_lead", "finance_lead", "volunteer_lead", "co_lead"]);

  const RoleSection = ({ title, users }: { title: string, users: any[] }) => {
    if (users.length === 0) return null;
    return (
      <div className="flex flex-col items-center mb-8">
        <Text weight="bold" className="mb-4 text-muted-foreground uppercase tracking-wider text-xs">{title}</Text>
        <div className="flex flex-wrap justify-center gap-4">
          {users.map(u => (
            <Card key={u.id} padding={4} className="min-w-[200px] flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
              <Avatar size="lg" src={u.image || undefined} name={u.name || "Unknown"} />
              <Text weight="medium" className="mt-3">{u.name}</Text>
              <Text type="supporting" className="text-xs uppercase">{u.role.replace(/_/g, " ")}</Text>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 bg-muted/10 rounded-xl border border-border overflow-x-auto min-h-[500px]">
      <div className="min-w-[800px] flex flex-col items-center">
        <RoleSection title="Faculty Coordinator" users={faculty} />
        
        {faculty.length > 0 && <div className="w-px h-8 bg-border -mt-8 mb-4"></div>}
        
        <RoleSection title="Club Owner / President" users={owners} />
        
        {owners.length > 0 && <div className="w-px h-8 bg-border -mt-8 mb-4"></div>}
        
        <RoleSection title="Administrators" users={admins} />
        
        {admins.length > 0 && <div className="w-px h-8 bg-border -mt-8 mb-4"></div>}
        
        <RoleSection title="Vice Leads" users={viceLeads} />
        
        {viceLeads.length > 0 && <div className="w-px h-8 bg-border -mt-8 mb-4"></div>}
        
        <RoleSection title="Domain Leads" users={leads} />
      </div>
    </div>
  );
}
