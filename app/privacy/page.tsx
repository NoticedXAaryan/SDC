export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: July 2026</p>
      
      <h2>1. Introduction</h2>
      <p>Welcome to SDC Parul Goa. We respect your privacy and are committed to protecting your personal data.</p>
      
      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Profile Data:</strong> Name, email, student ID, year, branch, and skills.</li>
        <li><strong>Biometric Data:</strong> If you opt-in to the Face ID system, we store an encrypted facial descriptor (not the raw photo) solely for anti-proxy attendance verification.</li>
        <li><strong>Activity Data:</strong> Event check-ins, projects submitted, and GitHub statistics.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>We use your data to issue verifiable certificates, track club attendance, and feature your projects. We do not sell your data.</p>
      
      <h2>4. Your Rights (GDPR / DPDP)</h2>
      <p>You can request an export of your data via our Compliance Dashboard, or request full account deletion.</p>
    </div>
  );
}
