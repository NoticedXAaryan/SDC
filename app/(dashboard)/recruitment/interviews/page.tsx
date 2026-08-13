import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { interviews, applications, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { ScheduleInterviewDialog } from "./components/schedule-interview-dialog";

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

  const interviewingApplicants = await db.select({
    id: applications.id,
    name: user.name,
    email: user.email,
  })
  .from(applications)
  .innerJoin(user, eq(applications.userId, user.id))
  .where(eq(applications.status, "interviewing"));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Interview Schedule" 
        description="Manage and schedule interviews with prospective club members."
        primaryAction={
          <ScheduleInterviewDialog applicants={interviewingApplicants as any[]} />
        }
      />

      {allInterviews.length === 0 ? (
        <EmptyState
          title="No interviews"
          description="There are currently no interviews scheduled."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allInterviews.map((interview) => (
            <Card key={interview.id}>
              <VStack gap={4}>
                <Text weight="semibold" className="text-lg">
                  Interview with {interview.applicantName}
                </Text>
                
                <VStack gap={1}>
                  <Text type="supporting" className="text-sm">
                    <Text as="span" weight="medium">Time: </Text>
                    {new Date(interview.scheduledAt).toLocaleString()}
                  </Text>
                  {interview.meetingLink && (
                    <Text type="supporting" className="text-sm">
                      <Text as="span" weight="medium">Link: </Text>
                      <a href={interview.meetingLink} className="text-blue-500 hover:underline">
                        {interview.meetingLink}
                      </a>
                    </Text>
                  )}
                </VStack>
              </VStack>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
