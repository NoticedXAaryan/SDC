import Link from "next/link";
import { Globe, Mail, MapPin, Users, Code } from "lucide-react";

const QUICK_LINKS = [
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "Register", href: "/register" },
  { label: "Login", href: "/login" },
] as const;


export function SiteFooter() {
  return (
    <footer className="bg-primary-strong bg-noise px-4 py-8 tablet:px-8 desktop:py-16">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-md bg-canvas bg-noise shadow-lg">
          <div className="px-6 pt-12 pb-8 tablet:px-12 desktop:pt-16">
            <div className="flex flex-col gap-12 desktop:flex-row desktop:justify-between">
              {/* Brand */}
              <div className="flex max-w-sm flex-col items-start">
                <h2 className="sr-only">Student Developer Club</h2>
                <Link href="/" className="inline-block" aria-label="Student Developer Club Home">
                  <img 
                    src="/logo.jpg" 
                    alt="Student Developer Club Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </Link>
                <p className="mt-6 text-ink-muted">
                  A vibrant community of tech enthusiasts, developers, and designers building the future together.
                </p>
                <p className="mt-4 text-sm font-semibold text-ink">
                  Empowering students at Parul University.
                </p>
              </div>

              <div className="flex flex-col gap-12 tablet:flex-row tablet:gap-24">
                {/* Quick links */}
              <nav aria-label="Quick Links">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink">
                  Quick Links
                </h3>
                <ul className="mt-6 space-y-3 text-ink-muted">
                  {QUICK_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink">
                  Get in Touch
                </h3>
                <ul className="mt-6 space-y-3 text-ink-muted">
                  <li>
                    <a
                      href="mailto:hello@sdc.paruluniversity.ac.in"
                      className="inline-flex items-start gap-2 transition-colors hover:text-primary"
                    >
                      <Mail aria-hidden="true" size={16} className="mt-1 shrink-0" />
                      <span className="break-all">
                        hello@sdc.paruluniversity.ac.in
                      </span>
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin aria-hidden="true" size={16} className="mt-1 shrink-0" />
                    <span>
                      <span className="block font-semibold text-ink">
                        Parul University
                      </span>
                      <span className="block">Vadodara, Gujarat</span>
                    </span>
                  </li>
                </ul>


              </div>
            </div>
          </div>

          {/* Registration prompt */}
            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-md border border-surface-alt bg-surface p-6 shadow-sm tablet:flex-row">
              <div>
                <p className="font-bold text-ink">Join the Community</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Become a member and start your tech journey.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex min-h-touch min-w-touch w-full items-center justify-center rounded-md bg-primary px-8 py-3 font-bold text-surface transition-colors hover:bg-primary-strong tablet:w-auto"
              >
                Join Us
              </Link>
            </div>

            <div className="mt-12 h-px w-full bg-surface-alt" />

            <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ink-muted tablet:flex-row tablet:justify-between">
              <p>© 2026 Student Developer Club. All rights reserved.</p>
              <p>
                Built by the Epic Team &{" "}
                <a
                  href="https://www.linkedin.com/in/NoticedXAAryan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink hover:text-primary transition-colors"
                >
                  Aaryan Kumar Tiwari
                </a>{" "}
                for the student developer community.
              </p>
            </div>
          </div>


        </div>
      </div>
    </footer>
  );
}
