import { VStack } from "@astryxdesign/core";

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-xl text-zinc-400">
              The rules and regulations for using the Student Dev Club platform.
            </p>
          </div>
          
          <div className="prose prose-invert prose-lg max-w-none prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
            <p>Last updated: August 2026</p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using this platform's particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>

            <h2>2. Code of Conduct</h2>
            <p>
              Members are expected to maintain professional behavior. Any form of harassment, unauthorized access attempts, 
              or misuse of club resources (including API endpoints and internal dashboards) will result in immediate termination of access.
            </p>

            <h2>3. Event Registrations & Passes</h2>
            <p>
              Event passes (QR Codes) are non-transferable unless explicitly stated. Generating or duplicating fraudulent passes 
              is strictly prohibited.
            </p>

            <h2>4. Limitation of Liability</h2>
            <p>
              The Student Dev Club provides this platform "as is" and shall not be held liable for any data loss, service interruptions, 
              or consequential damages arising from the use of this software.
            </p>
          </div>
        </VStack>
      </div>
    </main>
  );
}
