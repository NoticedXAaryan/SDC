"use client";

import Link from "next/link";
import { Button, EmptyState, Center } from "@astryxdesign/core";

export default function GlobalNotFound() {
  return (
    <Center minHeight="60vh">
      <EmptyState
        title="Lost in Space"
        description="The page you're looking for has drifted beyond our scanners or never existed."
        icon="Search"
        actions={
          <Link href="/">
            <Button variant="primary" label="Return to Base" />
          </Link>
        }
      />
    </Center>
  );
}
