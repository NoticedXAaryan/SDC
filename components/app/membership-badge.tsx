import { BadgeCheck, CircleUserRound } from "lucide-react";
import { isClubMember, membershipLabel } from "@/lib/membership";
export function MembershipBadge({ role }: { role: string }) {
  const member = isClubMember(role);
  const Icon = member ? BadgeCheck : CircleUserRound;
  return <span className="club-membership-badge" data-member={member}><Icon size={15} aria-hidden="true" />{membershipLabel(role)}</span>;
}
