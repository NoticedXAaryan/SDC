import { requireSession } from "@/lib/dal/auth";
import { SubmitProjectForm } from "./components/submit-project-form";
import { redirect } from "next/navigation";

export default async function SubmitProjectPage() {
  const session = await requireSession();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Submit a Project</h1>
        <p className="text-muted-foreground">Share what you've built with the community.</p>
      </div>
      
      <SubmitProjectForm />
    </div>
  );
}
