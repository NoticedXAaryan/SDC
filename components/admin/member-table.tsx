"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  useTablePagination,
  proportional,
  type TableColumn,
} from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useToast } from "@/components/astryx/toast-provider";

const SDC_ROLES = [
  "applicant", "alumni", "member", "faculty_coordinator",
  "co_lead", "volunteer_lead", "finance_lead", "tech_lead",
  "marketing_lead", "content_lead", "event_lead", "vice_lead",
  "lead", "admin", "owner",
] as const;

const BAN_DURATIONS = [
  { value: "86400", label: "24 hours" },
  { value: "604800", label: "7 days" },
  { value: "2592000", label: "30 days" },
  { value: "31536000", label: "1 year" },
  { value: "permanent", label: "Permanent" },
];

export type ManagedMember = {
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
  banReason: string | null;
  banExpires: Date | string | null;
  createdAt: Date | string;
  image: string | null;
};

function getRoleVariant(role: string | null): "neutral" | "success" | "warning" | "error" | "blue" | "teal" | "purple" {
  switch (role) {
    case "owner": return "purple";
    case "admin": return "error";
    case "lead": return "blue";
    case "co_lead": return "teal";
    case "finance_lead": return "success";
    case "alumni": return "warning";
    default: return "neutral";
  }
}

function formatBanStatus(member: ManagedMember) {
  if (!member.banned) return "Active";
  if (!member.banExpires) return "Banned";

  const expires = new Date(member.banExpires);
  if (Number.isNaN(expires.getTime())) return "Temporarily banned";
  return `Banned until ${expires.toLocaleDateString()}`;
}

export function MemberTable({
  initialMembers,
  total,
  currentUserRole,
  currentUserId,
}: {
  initialMembers: ManagedMember[];
  total: number;
  currentUserRole: string;
  currentUserId: string;
}) {
  const { error, success } = useToast();
  const [members, setMembers] = useState<ManagedMember[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ManagedMember | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(total);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [roleDraft, setRoleDraft] = useState("member");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("604800");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const pageSize = 20;
  const isOwner = currentUserRole === "owner";

  const assignableRoles = useMemo(
    () => SDC_ROLES
      .filter((role) => isOwner || (role !== "owner" && role !== "admin"))
      .map((role) => ({ value: role, label: role.replace(/_/g, " ") })),
    [isOwner],
  );

  function canManage(member: ManagedMember) {
    if (member.id === currentUserId) return false;
    if (isOwner) return true;
    return member.role !== "owner" && member.role !== "admin";
  }

  function openManager(member: ManagedMember) {
    setSelectedMember(member);
    setEditName(member.name);
    setEditUsername(member.username ?? "");
    setEditYear(member.year ? String(member.year) : "");
    setEditBranch(member.branch ?? "");
    setRoleDraft(member.role ?? "member");
    setBanReason("");
    setBanDuration("604800");
    setDeleteConfirmation("");
  }

  function mergeMember(updated: ManagedMember) {
    setMembers((current) => current.map((member) =>
      member.id === updated.id ? { ...member, ...updated } : member
    ));
    setSelectedMember((current) =>
      current?.id === updated.id ? { ...current, ...updated } : current
    );
  }

  async function fetchMembers(searchTerm = search, pageNum = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageSize),
      });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/members?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load members");

      setMembers(data.members);
      setTotalCount(data.pagination.total);
    } catch (caught) {
      console.error("Failed to fetch members:", caught);
      error(caught instanceof Error ? caught.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  async function runLifecycleAction(payload: Record<string, unknown>) {
    if (!selectedMember) return null;
    setActionPending(true);
    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Account action failed");
      if (data.member) mergeMember(data.member);
      success(data.message || "Account updated");
      return data;
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Account action failed");
      return null;
    } finally {
      setActionPending(false);
    }
  }

  async function saveProfile() {
    await runLifecycleAction({
      action: "update",
      name: editName,
      username: editUsername.trim() || null,
      year: editYear ? Number(editYear) : null,
      branch: editBranch.trim() || null,
    });
  }

  async function saveRole() {
    if (!selectedMember || roleDraft === selectedMember.role) return;
    setActionPending(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedMember.id, role: roleDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      mergeMember(data.member);
      success(data.message || "Role updated");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Failed to update role");
    } finally {
      setActionPending(false);
    }
  }

  async function banMember() {
    if (!banReason.trim()) {
      error("Add a reason before banning this account");
      return;
    }
    await runLifecycleAction({
      action: "ban",
      reason: banReason.trim(),
      durationSeconds: banDuration === "permanent" ? null : Number(banDuration),
    });
  }

  async function deleteMember() {
    if (!selectedMember || deleteConfirmation !== selectedMember.name) {
      error("Type the member's exact name to confirm deletion");
      return;
    }

    setActionPending(true);
    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmUserId: selectedMember.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      setMembers((current) => current.filter((member) => member.id !== selectedMember.id));
      setTotalCount((current) => Math.max(0, current - 1));
      setSelectedMember(null);
      success(data.message || "Account deleted");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Failed to delete account");
    } finally {
      setActionPending(false);
    }
  }

  function handleSearch() {
    setPage(1);
    void fetchMembers(search, 1);
  }

  const paginationPlugin = useTablePagination<Record<string, unknown>>({
    page,
    onPageChange: (newPage) => {
      setPage(newPage);
      void fetchMembers(search, newPage);
    },
    totalItems: totalCount,
    pageSize,
  });

  const columns = useMemo<TableColumn<Record<string, unknown>>[]>(() => [
    {
      key: "name",
      header: "Name",
      width: proportional(2),
      renderCell: (item) => {
        const member = item as unknown as ManagedMember;
        return (
          <VStack gap={0}>
            <Text weight="medium">{member.name}</Text>
            {member.username && <Text type="supporting">@{member.username}</Text>}
          </VStack>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      width: proportional(2),
      renderCell: (item) => (
        <Text type="supporting">{(item as unknown as ManagedMember).email}</Text>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: proportional(1),
      renderCell: (item) => {
        const member = item as unknown as ManagedMember;
        return (
          <Badge
            variant={getRoleVariant(member.role)}
            label={(member.role || "member").replace(/_/g, " ")}
          />
        );
      },
    },
    {
      key: "points",
      header: "Points",
      width: proportional(1),
      renderCell: (item) => (
        <Text type="supporting">{(item as unknown as ManagedMember).points ?? 0}</Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: proportional(1.5),
      renderCell: (item) => {
        const member = item as unknown as ManagedMember;
        return (
          <Text
            type="supporting"
            className={member.banned ? "font-medium text-red-500" : "font-medium text-green-500"}
          >
            {formatBanStatus(member)}
          </Text>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: proportional(1),
      align: "end",
      renderCell: (item) => {
        const member = item as unknown as ManagedMember;
        if (member.id === currentUserId) {
          return <Text type="supporting" className="italic text-xs">You</Text>;
        }
        if (!canManage(member)) {
          return <Text type="supporting" className="italic text-xs">Restricted</Text>;
        }
        return (
          <Button
            label="Manage"
            variant="secondary"
            size="sm"
            onClick={() => openManager(member)}
          />
        );
      },
    },
  ], [currentUserId, isOwner]);

  return (
    <>
      <VStack gap={4}>
        <HStack gap={2} align="center">
          <div className="max-w-md w-full">
            <TextInput
              label="Search accounts"
              htmlName="search"
              value={search}
              onChange={setSearch}
              placeholder="Name, email, or username"
              onEnter={handleSearch}
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

      <Dialog
        isOpen={selectedMember !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !actionPending) setSelectedMember(null);
        }}
        purpose="form"
        width="min(720px, calc(100vw - 32px))"
        maxHeight="90vh"
        aria-label={selectedMember ? `Manage ${selectedMember.name}` : "Manage account"}
      >
        {selectedMember && (
          <div className="max-h-[86vh] space-y-5 overflow-y-auto p-1">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-semibold">Manage {selectedMember.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{selectedMember.email}</p>
            </div>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <h3 className="font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">Update directory and academic details.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label="Name" value={editName} onChange={setEditName} isRequired />
                <TextInput label="Username" value={editUsername} onChange={setEditUsername} isOptional />
                <TextInput label="Year" value={editYear} onChange={setEditYear} isOptional />
                <TextInput label="Branch" value={editBranch} onChange={setEditBranch} isOptional />
              </div>
              <Button
                label="Save profile"
                variant="primary"
                isLoading={actionPending}
                isDisabled={!editName.trim()}
                clickAction={saveProfile}
              />
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <h3 className="font-medium">Role and sessions</h3>
                <p className="text-sm text-muted-foreground">Role changes and session revocation take effect immediately.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Selector
                  label="Role"
                  htmlName={`role-${selectedMember.id}`}
                  options={assignableRoles}
                  value={roleDraft}
                  onChange={(value) => value && setRoleDraft(value)}
                  isDisabled={actionPending}
                />
                <Button
                  label="Update role"
                  variant="secondary"
                  isLoading={actionPending}
                  isDisabled={roleDraft === selectedMember.role}
                  clickAction={saveRole}
                />
              </div>
              <Button
                label="Revoke all sessions"
                variant="secondary"
                isLoading={actionPending}
                clickAction={() => runLifecycleAction({ action: "revoke_sessions" })}
              />
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <h3 className="font-medium">Account access</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMember.banned
                    ? selectedMember.banReason || "This account is currently banned."
                    : "Temporarily suspend or permanently ban this account."}
                </p>
              </div>
              {selectedMember.banned ? (
                <Button
                  label="Restore account access"
                  variant="primary"
                  isLoading={actionPending}
                  clickAction={() => runLifecycleAction({ action: "unban" })}
                />
              ) : (
                <>
                  <TextArea
                    label="Ban reason"
                    value={banReason}
                    onChange={setBanReason}
                    maxLength={500}
                    rows={3}
                    isRequired
                  />
                  <Selector
                    label="Duration"
                    htmlName={`ban-duration-${selectedMember.id}`}
                    options={BAN_DURATIONS}
                    value={banDuration}
                    onChange={(value) => value && setBanDuration(value)}
                    isDisabled={actionPending}
                  />
                  <Button
                    label="Ban account"
                    variant="destructive"
                    isLoading={actionPending}
                    isDisabled={banReason.trim().length < 3}
                    clickAction={banMember}
                  />
                </>
              )}
            </section>

            {isOwner && (
              <section className="space-y-3 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
                <div>
                  <h3 className="font-medium text-red-500">Danger zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanent deletion removes the account and dependent records. Type the exact member name to continue.
                  </p>
                </div>
                <TextInput
                  label={`Type “${selectedMember.name}”`}
                  value={deleteConfirmation}
                  onChange={setDeleteConfirmation}
                />
                <Button
                  label="Permanently delete account"
                  variant="destructive"
                  isLoading={actionPending}
                  isDisabled={deleteConfirmation !== selectedMember.name}
                  clickAction={deleteMember}
                />
              </section>
            )}

            <div className="flex justify-end border-t border-border pt-4">
              <Button
                label="Close"
                variant="secondary"
                isDisabled={actionPending}
                onClick={() => setSelectedMember(null)}
              />
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
