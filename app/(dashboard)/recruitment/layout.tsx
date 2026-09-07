import { requirePageSession } from "@/lib/dal/auth";

export default async function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession("/recruitment/apply");
  return <>{children}</>;
}
