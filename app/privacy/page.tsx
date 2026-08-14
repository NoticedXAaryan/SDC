import { PageHeader } from "@/components/astryx/page-header";
import { AppTopNav } from "@/components/astryx/app-topnav";
import { AppShell, VStack, Text, Heading } from "@astryxdesign/core";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 flex-1 mt-16">
        <VStack gap={8}>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-xl text-zinc-400">
              How we collect, use, and protect your data across the Student Dev Club platform.
            </p>
          </div>
          
          <div className="prose prose-invert prose-lg max-w-none prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
            <p>Last updated: August 2026</p>
            
            <h2>1. Information We Collect</h2>
            <p>
              When you register for SDC, we collect your name, university email, and basic profile information. 
              We may also collect data related to your participation in events, projects, and recruitment pipelines.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
              Your data is used to manage your membership, track your event attendance (via QR passes and scanners), 
              issue verified certificates, and operate the club's internal dashboards.
            </p>

            <h2>3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share basic profile information internally with Domain Leads 
              and Administrators strictly for club operations and recruitment processing.
            </p>

            <h2>4. Your Rights (GDPR / Compliance)</h2>
            <p>
              You have the right to request an export of your data or request complete account deletion from your 
              Settings dashboard. Deletions are processed automatically and purge all PII.
            </p>
          </div>
        </VStack>
      </div>
    </main>
  );
}
