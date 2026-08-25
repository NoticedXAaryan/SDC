import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Metadata } from "next";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Setup Complete | Student Developer Club",
  description: "Your account is ready.",
};

interface SetupPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const callbackUrl = sanitizeAuthRedirect((await searchParams).callbackUrl);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">You're all set!</h1>
          <p className="text-muted-foreground">
            Your account has been created successfully. Welcome to the Student Developer Club.
          </p>
        </div>

        <Button asChild className="w-full h-12 text-lg" size="lg">
          <Link href={callbackUrl}>
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
