import { requireRole } from "@/lib/dal/auth";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { FolderGit2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireRole(["admin", "owner", "tech_lead", "lead"]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Club Projects"
        description="Manage internal and external club projects."
      />

      <EmptyState
        icon={<FolderGit2 />}
        title="Projects Module Coming Soon"
        description="The project tracking system is currently under development."
      />
    </div>
  );
}
