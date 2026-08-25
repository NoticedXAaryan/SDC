import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal/auth";

/** Compatibility route retained for existing admin bookmarks. */
export default async function ManageSettingsPage() {
  await requireAdmin();
  redirect("/settings");
}
