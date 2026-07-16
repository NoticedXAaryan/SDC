"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DomainSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Domain Settings</h2>
          <p className="text-muted-foreground">Configure your domain parameters and permissions</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Domain specific settings will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
