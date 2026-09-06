import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalSection {
  title: string;
  content: ReactNode;
}

export function LegalPage({ title, description, updated, sections }: { title: string; description: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-indigo-500/30">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>
      <article className="relative z-10 mx-auto w-full max-w-4xl px-6 py-12 md:py-20">
        <Link href="/" className="mb-12 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to home
        </Link>
        <header className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="text-lg leading-8 text-zinc-400 md:text-xl">{description}</p>
          <p className="pt-3 text-sm text-zinc-500">Last updated: {updated}</p>
        </header>
        <div className="mt-12 space-y-10">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`legal-section-${index}`} className="max-w-3xl space-y-3 border-t border-white/10 pt-8">
              <h2 id={`legal-section-${index}`} className="text-2xl font-semibold tracking-tight md:text-3xl">{index + 1}. {section.title}</h2>
              <div className="text-base leading-7 text-zinc-300">{section.content}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
