"use client";

import { PageHeader } from "@/components/astryx/page-header";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export default function DomainSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader 
        title="Domain Settings" 
        description="Configure your domain parameters and permissions"
      />
      
      <Card padding={6}>
        <VStack gap={4}>
          <Text weight="bold" className="text-xl">Coming Soon</Text>
          <Text type="supporting" className="text-sm">Domain specific settings will be available here.</Text>
        </VStack>
      </Card>
    </div>
  );
}
