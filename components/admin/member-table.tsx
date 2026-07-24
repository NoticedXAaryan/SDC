"use client";
import React, { useState, useMemo } from "react";
import { 
  Table, 
  useTablePagination,
  proportional,
  type TableColumn,
} from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { useToast } from "@/components/astryx/toast-provider";

const SDC_ROLES = [
  "applicant", "alumni", "member", "faculty_coordinator",
  "co_lead", "volunteer_lead", "finance_lead", "tech_lead",
  "marketing_lead", "content_lead", "event_lead", "vice_lead",
  "lead", "admin", "owner"
] as const;

type Member = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  username: string | null;
  year: number | null;
  branch: string | null;
  points: number | null;
  level: number | null;
  banned: boolean | null;
  createdAt: Date;
  image: string | null;
};

function getRoleVariant(role: string | null): "neutral" | "success" | "warning" | "error" | "blue" | "teal" | "purple" | "pink" | "orange" {
  switch (role) {
    case "owner": return "purple";
    case "admin": return "error";
    case "lead": return "blue";
    case "co_lead": return "teal";
    case "finance_lead": return "success";
    case "member": return "neutral";
    case "alumni": return "warning";
    default: return "neutral";
  }
}

export function MemberTable({
  initialMembers,
  total,
  currentUserRole,
  currentUserId,
}: {
  initialMembers: Member[];
  total: number;
  currentUserRole: string;
  currentUserId: string;
}) {
  const { error, success } = useToast();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  
  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(total);
  const pageSize = 20;

  const canChangeRoles = ["admin", "owner"].includes(currentUserRole);

  async function fetchMembers(searchTerm?: string, pageNum?: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (pageNum) params.set("page", String(pageNum));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/members?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setMembers(data.members);
        setTotalCount(data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
      error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!canChangeRoles) return;
    if (userId === currentUserId) {
      error("Cannot change your own role");
      return;
    }

    const confirmed = confirm(`Change this member's role to "${newRole.replace(/_/g, " ")}"?`);
    if (!confirmed) return;

    setChangingRole(userId);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setMembers(prev =>
          prev.map(m => m.id === userId ? { ...m, role: newRole } : m)
        );
        success("Role updated");
      } else {
        error(data.error || "Failed to update role");
      }
    } catch (err) {
      error("Network error. Please try again.");
    } finally {
      setChangingRole(null);
    }
  }

  function handleSearch() {
    setPage(1);
    fetchMembers(search, 1);
  }

  const paginationPlugin = useTablePagination<Record<string, unknown>>({
    page,
    onPageChange: (newPage) => {
      setPage(newPage);
      fetchMembers(search, newPage);
    },
    totalItems: totalCount,
    pageSize,
  });

  const columns = useMemo<TableColumn<Record<string, unknown>>[]>(() => {
    const cols: TableColumn<Record<string, unknown>>[] = [
      {
        key: "name",
        header: "Name",
        width: proportional(2),
        renderCell: (item) => {
          const m = item as unknown as Member;
          return (
            <VStack gap={0}>
              <Text weight="medium">{m.name}</Text>
              {m.username && <Text type="supporting">@{m.username}</Text>}
            </VStack>
          );
        },
      },
      {
        key: "email",
        header: "Email",
        width: proportional(2),
        renderCell: (item) => {
          const m = item as unknown as Member;
          return <Text type="supporting">{m.email}</Text>;
        },
      },
      {
        key: "role",
        header: "Role",
        width: proportional(1),
        renderCell: (item) => {
          const m = item as unknown as Member;
          return (
            <Badge 
              variant={getRoleVariant(m.role)} 
              label={(m.role || "member").replace(/_/g, " ")} 
            />
          );
        },
      },
      {
        key: "year",
        header: "Year",
        width: proportional(1),
        renderCell: (item) => {
          const m = item as unknown as Member;
          return <Text type="supporting">{m.year ? String(m.year) : "—"}</Text>;
        },
      },
      {
        key: "points",
        header: "Points",
        width: proportional(1),
        renderCell: (item) => {
          const m = item as unknown as Member;
          return <Text type="supporting">{m.points ?? 0}</Text>;
        },
      },
      {
        key: "status",
        header: "Status",
        width: proportional(1),
        renderCell: (item) => {
          const m = item as unknown as Member;
          return (
            <Text type="supporting" className={m.banned ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
              {m.banned ? "Banned" : "Active"}
            </Text>
          );
        },
      },
    ];

    if (canChangeRoles) {
      cols.push({
        key: "actions",
        header: "Actions",
        width: proportional(1),
        align: "end",
        renderCell: (item) => {
          const m = item as unknown as Member;
          if (m.id === currentUserId) {
            return <Text type="supporting" className="italic text-xs">You</Text>;
          }
          return (
            <Selector
              label="Change Role"
              htmlName={`role-${m.id}`}
              options={SDC_ROLES.map(r => ({ value: r, label: r.replace(/_/g, " ") }))}
              value={m.role || "member"}
              onChange={(val) => {
                if (val) handleRoleChange(m.id, val);
              }}
              isDisabled={changingRole === m.id}
            />
          );
        },
      });
    }

    return cols;
  }, [canChangeRoles, currentUserId, changingRole]);

  return (
    <VStack gap={4}>
      <HStack gap={2} align="center">
        <div className="max-w-md w-full">
          <TextInput
            label="Search"
            htmlName="search"
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or username..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <Button
          label={loading ? "Searching..." : "Search"}
          variant="primary"
          isDisabled={loading}
          onClick={handleSearch}
        />
      </HStack>

      <Table
        data={members as unknown as Record<string, unknown>[]}
        columns={columns}
        plugins={{ pagination: paginationPlugin }}
        hasHover
        dividers="rows"
      />
    </VStack>
  );
}
