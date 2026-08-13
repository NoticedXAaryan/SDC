import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FaceEnrollmentClient } from "@/components/settings/face-enrollment-client";

export default async function FaceEnrollmentPage() {
  const session = await requireSession();
  
  // Check if user has face enrolled
  const [currentUser] = await db.select({ faceDescriptor: user.faceDescriptor })
    .from(user)
    .where(eq(user.id, session.user.id));
    
  const isEnrolled = !!currentUser?.faceDescriptor;
  
  return (
    <div className="pb-12">
      <FaceEnrollmentClient isEnrolled={isEnrolled} />
    </div>
  );
}
