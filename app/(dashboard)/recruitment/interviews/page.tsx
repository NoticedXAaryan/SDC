import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { interviews, applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InterviewsPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const allInterviews = await db.select({
    id: interviews.id,
    scheduledAt: interviews.scheduledAt,
    meetingLink: interviews.meetingLink,
    applicantName: user.name,
  })
  .from(interviews)
  .leftJoin(applications, eq(interviews.applicantId, applications.id))
  .leftJoin(user, eq(applications.userId, user.id));

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interview Schedule</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allInterviews.map((interview) => (
          <Card key={interview.id}>
            <CardHeader>
              <CardTitle>Interview with {interview.applicantName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Time:</span> {new Date(interview.scheduledAt).toLocaleString()}
              </p>
              {interview.meetingLink && (
                <p className="text-sm">
                  <span className="font-medium">Link:</span> <a href={interview.meetingLink} className="text-blue-500 hover:underline">{interview.meetingLink}</a>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {allInterviews.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed rounded-lg text-muted-foreground">
            No interviews scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
