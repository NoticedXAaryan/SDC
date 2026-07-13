"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, UserCircle, Rocket } from "lucide-react";

export default function SetupWizardPage() {
  const router = useRouter();

  const handleFinish = async () => {
    // In a real implementation, we would update the user's `setupCompleted` flag in the DB
    toast.success("Profile setup complete! Welcome to SDC.");
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to SDC!</CardTitle>
          <CardDescription>
            You have successfully joined the club. Let's finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Application Approved</h4>
                <p className="text-sm text-muted-foreground">Your onboarding profile has been synced.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <UserCircle className="h-6 w-6 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Verify Profile Data</h4>
                <p className="text-sm text-muted-foreground">Check your profile settings later to make sure your GitHub and LinkedIn links are correct.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleFinish} className="w-full" size="lg">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
