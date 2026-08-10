import { requireRole } from "@/lib/dal/auth";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireRole(["admin", "owner", "finance_lead"]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Finance Overview"
        description="High-level financial reports and budget tracking."
      />

      <EmptyState
        icon={<Wallet />}
        title="Finance Dashboard Coming Soon"
        description="The finance overview is currently under development. Please check back later."
      />
    </div>
  );
}
