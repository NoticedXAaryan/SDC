import Link from "next/link";
import { Button, EmptyState, Center } from "@astryxdesign/core";

export default function GlobalForbidden() {
  return (
    <Center minHeight="60vh">
      <EmptyState
        title="Access Denied"
        description="You do not have the required clearance to access this quadrant."
        icon="Shield"
        actions={
          <Link href="/">
            <Button variant="primary" label="Return to Base" />
          </Link>
        }
      />
    </Center>
  );
}
