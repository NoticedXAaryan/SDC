import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}
export function AuthLayout({ children }: AuthLayoutProps) {
  return <main className="club-auth">
    <header className="club-auth-header">
      <Link href="/" className="club-auth-brand" aria-label="Student Developer Club home">sdc<span>.</span><small>Parul University</small></Link>
      <Link href="/" className="club-text-link"><ArrowLeft size={16} aria-hidden="true" />Back to the club</Link>
    </header>
    <div className="club-auth-layout">
      <section className="club-auth-intro" aria-label="About your club account">
        <p className="club-eyebrow">Student Developer Club</p>
        <p className="club-auth-statement">Good things<br />start with<br /><span>curiosity.</span></p>
        <p>A workshop that makes something click. A project you build with friends. A community to figure it out with.</p>
        <Link href="/events" className="club-text-link">See what's happening<ArrowRight size={17} aria-hidden="true" /></Link>
        <div className="club-auth-caption"><span aria-hidden="true">↗</span> Learn. Build. Share.</div>
      </section>
      <section className="club-auth-form" aria-label="Your account">{children}</section>
    </div>
    <footer className="club-auth-footer"><span>Student Developer Club · Parul University</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></footer>
  </main>;
}
