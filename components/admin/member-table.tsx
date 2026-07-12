"use client";

import { useState } from "react";
import type { SDCRole } from "@/lib/dal/auth";

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

const ROLES: SDCRole[] = ["applicant", "member", "co_lead", "finance_lead", "lead", "admin", "owner"];

function getRoleColor(role: string | null): string {
  const colors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    lead: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    co_lead: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    finance_lead: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    member: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    alumni: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return colors[role || "member"] || colors.member;
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
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(total);

  const totalPages = Math.ceil(totalCount / 20);
  const canChangeRoles = ["admin", "owner"].includes(currentUserRole);

  async function fetchMembers(searchTerm?: string, pageNum?: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (pageNum) params.set("page", String(pageNum));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/members?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setMembers(data.members);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!canChangeRoles) return;
    if (userId === currentUserId) {
      alert("You cannot change your own role.");
      return;
    }

    const confirmed = confirm(`Change this member's role to "${newRole}"?`);
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
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setChangingRole(null);
    }
  }

  function handleSearch() {
    setPage(1);
    fetchMembers(search, 1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchMembers(search, newPage);
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by name, email, or username..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Points</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                {canChangeRoles && (
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{member.name}</div>
                    {member.username && (
                      <div className="text-xs text-muted-foreground">@{member.username}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role || "member"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.year || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.points ?? 0}</td>
                  <td className="px-4 py-3">
                    {member.banned ? (
                      <span className="text-xs text-red-500 font-medium">Banned</span>
                    ) : (
                      <span className="text-xs text-green-500 font-medium">Active</span>
                    )}
                  </td>
                  {canChangeRoles && (
                    <td className="px-4 py-3">
                      {member.id !== currentUserId ? (
                        <select
                          value={member.role || "member"}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={changingRole === member.id}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">You</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={canChangeRoles ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
