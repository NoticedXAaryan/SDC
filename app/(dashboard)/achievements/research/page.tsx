import { requireSession } from "@/lib/dal/auth";
import { PageHeader } from "@/components/astryx/page-header";
import { ResearchList } from "./components/research-list";
import { Button } from "@astryxdesign/core/Button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  await requireSession();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Published Research"
        description="View research papers published by our members."
        primaryAction={
          <Button variant="primary" label="Submit Paper" icon={<Plus className="w-4 h-4" />} />
        }
      />

      <ResearchList />
    </div>
  );
}
