import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import InitForm from "./init-form";

export const dynamic = "force-dynamic";

export default async function SystemInitPage() {
  // Check if owner already exists
  const [ownerCount] = await db.select({ count: sql<number>`count(*)` })
    .from(user)
    .where(eq(user.role, "owner"));

  const isLocked = Number(ownerCount.count) > 0;

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card padding={8} className="max-w-md w-full shadow-2xl border-border/50 bg-background/50 backdrop-blur-xl">
          <VStack gap={4} className="text-center items-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <Text weight="bold" className="text-2xl">System Initialized</Text>
            <Text type="supporting" className="text-sm mb-4">
              The owner account has already been provisioned. This setup page is now permanently locked for security.
            </Text>
            <Button asChild className="w-full">
              <a href="/login">Go to Login</a>
            </Button>
          </VStack>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card padding={8} className="max-w-md w-full shadow-2xl border-border/50">
        <VStack gap={6}>
          <VStack gap={2} className="text-center items-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <Text weight="bold" className="text-2xl tracking-tight">System Initialization</Text>
            <Text type="supporting" className="text-sm">
              Provision the master owner account using environment configurations.
            </Text>
          </VStack>

          <InitForm />
        </VStack>
      </Card>
    </div>
  );
}
