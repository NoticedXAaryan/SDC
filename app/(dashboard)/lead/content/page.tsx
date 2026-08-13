import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { contentItems, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ContentCalendarPage() {
  await requireRole(["content_lead", "lead", "admin", "owner"]);

  const items = await db.select({
    content: contentItems,
    author: { name: user.name }
  })
  .from(contentItems)
  .leftJoin(user, eq(contentItems.authorId, user.id))
  .orderBy(desc(contentItems.createdAt));

  const columns = [
    { id: "idea", title: "Ideas" },
    { id: "drafting", title: "Drafting" },
    { id: "review", title: "In Review" },
    { id: "scheduled", title: "Scheduled" },
    { id: "published", title: "Published" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Content Calendar</h1>
        <p className="text-muted-foreground">Manage social media posts and blog content across platforms.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colItems = items.filter(i => i.content.status === col.id);
          
          return (
            <div key={col.id} className="min-w-[300px] flex-1 bg-muted/40 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-semibold">{col.title}</h3>
                <Badge variant="secondary">{colItems.length}</Badge>
              </div>
              
              <div className="flex flex-col gap-3">
                {colItems.map(({ content, author }) => (
                  <Card key={content.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {content.platform || "General"}
                        </Badge>
                      </div>
                      <CardTitle className="text-base leading-tight">{content.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {content.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">By {author?.name || "Unknown"}</span>
                        {content.scheduledFor && (
                          <span className="text-[10px] font-medium text-blue-600">
                            {new Date(content.scheduledFor).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {colItems.length === 0 && (
                  <div className="text-center p-4 border border-dashed rounded-lg text-xs text-muted-foreground">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
