import { requireSession } from "@/lib/dal/auth";
import { PageHeader } from "@/components/astryx/page-header";
import { CompetitionsList } from "./components/competitions-list";
import { Button } from "@astryxdesign/core/Button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  await requireSession();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Competitions & Hackathons"
        description="View and track achievements from our members."
        primaryAction={
          <Button variant="primary" label="Submit Win" icon={<Plus className="w-4 h-4" />} />
        }
      />

      <CompetitionsList />
    </div>
  );
}
