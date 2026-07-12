import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ApplyPage() {
  const session = await requireSession();

  // Handle application submission via server action in a real app
  
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Join the STC Core Team</CardTitle>
          <CardDescription>Fill out the application below to join our student organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Why do you want to join?</label>
            <textarea className="w-full min-h-[100px] p-3 border rounded-md" placeholder="Your motivation..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">What is your primary domain of interest?</label>
            <select className="w-full p-2 border rounded-md">
              <option>Technical (Web/App)</option>
              <option>Design</option>
              <option>Marketing</option>
              <option>Management</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Submit Application</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
