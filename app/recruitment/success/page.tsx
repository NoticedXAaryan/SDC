"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ApplicationSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle>Application Submitted</CardTitle>
          <CardDescription>Your application is under review.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We will notify you about the next steps. You can check your application status on your dashboard.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
