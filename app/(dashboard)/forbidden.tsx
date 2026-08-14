import Link from "next/link";
import { Button, EmptyState, Center } from "@astryxdesign/core";

export default function DashboardForbidden() {
  return (
    <Center minHeight="60vh">
      <EmptyState
        title="Restricted Access"
        description="Your current role does not grant you access to this dashboard feature."
        icon="Shield"
        actions={
          <Link href="/dashboard">
            <Button variant="secondary" label="Go to Dashboard Home" />
          </Link>
        }
      />
    </Center>
  );
}
