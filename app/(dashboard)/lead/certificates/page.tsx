import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CertificatesDashboardPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const templates = await db.select().from(certificateTemplates);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Certificates & Templates</h1>
        {/* We would have a dialog here to create a new template, simplified for now to a button that links to a new template page or action */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>Created by {template.createdBy}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/lead/certificates/templates/${template.id}/edit`}>
                  Edit Design
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            No templates found. Please create one via API.
          </div>
        )}
      </div>
    </div>
  );
}
