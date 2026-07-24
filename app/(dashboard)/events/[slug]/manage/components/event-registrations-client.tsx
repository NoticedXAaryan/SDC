"use client";

import { DataTable } from "@/components/astryx/data-table";
import { Badge, Button, Avatar, HStack } from "@astryxdesign/core";
import { PowerSearchConfig } from "@astryxdesign/core/PowerSearch";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export function EventRegistrationsClient({ registrations }: { registrations: any[] }) {
  const columns = [
    {
      key: "user",
      header: "Attendee",
      render: (item: any) => (
        <HStack align="center" gap={3}>
          <Avatar name={item.user.name} src={item.user.image} size="sm" />
          <div>
            <div className="font-medium">{item.user.name}</div>
            <div className="text-sm text-muted-foreground">{item.user.email}</div>
          </div>
        </HStack>
      ),
      sortable: true
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => {
        let variant: "success" | "error" | "warning" | "neutral" = "neutral";
        if (item.status === "confirmed") variant = "success";
        if (item.status === "cancelled") variant = "error";
        if (item.status === "waitlist") variant = "warning";
        
        return <Badge variant={variant} label={item.status.toUpperCase()} />;
      },
      sortable: true
    },
    {
      key: "checkedInAt",
      header: "Check-in",
      render: (item: any) => {
        if (item.checkedInAt) {
          return <span className="text-green-600 font-medium text-sm">Checked In</span>;
        }
        return <span className="text-muted-foreground text-sm">Pending</span>;
      },
      sortable: true
    },
    {
      key: "createdAt",
      header: "Registered",
      render: (item: any) => new Date(item.createdAt).toLocaleDateString(),
      sortable: true
    },
    {
      key: "actions",
      header: "",
      render: (item: any) => (
        <Button 
          variant="ghost" 
          size="sm" 
          label="View Member"
          isIconOnly 
          icon={<ExternalLink className="w-4 h-4" />} 
          href={`/admin/members/${item.userId}`}
        />
      ),
      align: "end" as const
    }
  ];

  const searchConfig: PowerSearchConfig = {
    name: "RegistrationsSearch",
    fields: [
      {
        key: "name",
        label: "Name",
        operators: [
          { key: "contains", label: "contains", value: { type: "string" } }
        ]
      },
      {
        key: "email",
        label: "Email",
        operators: [
          { key: "contains", label: "contains", value: { type: "string" } }
        ]
      },
      {
        key: "status",
        label: "Status",
        operators: [
          {
            key: "is",
            label: "is",
            value: {
              type: "enum",
              values: [
                { value: "confirmed", label: "Confirmed" },
                { value: "waitlist", label: "Waitlist" },
                { value: "cancelled", label: "Cancelled" }
              ]
            }
          }
        ]
      }
    ]
  };

  return (
    <DataTable
      data={registrations}
      columns={columns}
      searchConfig={searchConfig}
      getRowId={(item) => item.id}
    />
  );
}
