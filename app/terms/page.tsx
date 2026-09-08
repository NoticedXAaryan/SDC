import { LegalPage } from "@/components/legal/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The practical rules for using the Student Developer Club platform and its shared resources."
      updated="August 2026"
      sections={[
        {
          title: "Acceptance of Terms",
          content: <p>By using the platform, you agree to these terms and to the event, team, and resource guidelines published by the club.</p>,
        },
        {
          title: "Code of Conduct",
          content: <p>Members must act professionally. Harassment, unauthorized access, impersonation, fraudulent submissions, and misuse of club systems or equipment may result in suspended or terminated access.</p>,
        },
        {
          title: "Events, Passes, and Certificates",
          content: <p>Event passes are non-transferable unless an organizer says otherwise. Attendance and certificates must reflect real participation; forged passes, check-ins, or credentials are prohibited.</p>,
        },
        {
          title: "Shared Work and Availability",
          content: <p>Club projects, forms, schedules, and operational tools are provided for collaborative use. The club may moderate published work and cannot guarantee uninterrupted availability, but it will preserve records and communicate material workflow outcomes where the platform supports them.</p>,
        },
      ]}
    />
  );
}
