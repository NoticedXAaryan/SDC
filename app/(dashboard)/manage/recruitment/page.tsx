"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, CheckCircle2, UserPlus, Users, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RecruitmentManagementPage() {
  const [stats, setStats] = useState({ applied: 124, oa: 85, interview: 42, offered: 15 });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recruitment Dashboard</h2>
          <p className="text-muted-foreground">Manage ongoing recruitment cycles and candidate reviews</p>
        </div>
        <Button><UserPlus className="mr-2 h-4 w-4" /> Start New Cycle</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In OA Stage</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.oa}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers Extended</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offered}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Candidate #{1042 + i}</p>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending OA Review</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Applied for Tech Team • 2 days ago</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Profile</Button>
                  <Button size="sm">Evaluate</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
