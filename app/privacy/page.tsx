import { LegalPage } from "@/components/legal/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How we collect, use, protect, export, and delete data across the Student Developer Club platform."
      updated="August 2026"
      sections={[
        {
          title: "Information We Collect",
          content: <p>When you register, we collect your name, university email, and profile information. We also store data you create through events, forms, projects, recruitment, achievements, certificates, and club operations.</p>,
        },
        {
          title: "How We Use Your Information",
          content: <p>We use this data to manage membership, event attendance, QR passes, recruitment, team workflows, points, verified certificates, and the club’s internal dashboards.</p>,
        },
        {
          title: "Data Sharing",
          content: <p>We do not sell personal data. Authorized club leads, administrators, and faculty coordinators receive only the access required for their operational responsibilities.</p>,
        },
        {
          title: "Exports and Account Deletion",
          content: <p>You can export your account data or delete your account from Settings. Deletion disables sign-in, anonymizes your profile, removes private participation records and stored personal files, and detaches retained public work. Financial, security, and operational audit records may remain linked to the anonymized account when required for integrity and accountability.</p>,
        },
      ]}
    />
  );
}
