import Link from "next/link";
import { ArrowRight, Award, CalendarDays, Check, MapPin, QrCode, UserRound } from "lucide-react";
import { describeApplicationStatus } from "@/lib/domain/application-status";
import type { DashboardUser, UpcomingEvent, UserApplication, UserCertificate, UserRegistration } from "./dashboard-types";

interface StudentDashboardProps {
  user: DashboardUser;
  myRegistrations?: UserRegistration[];
  upcomingEvents?: UpcomingEvent[];
  myApplication?: UserApplication | null;
  myCertificates?: UserCertificate[];
  attendedCount?: number;
}
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", weekday: "short", timeZone: "Asia/Kolkata" });
const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function EventDate({ value }: { value: Date | string }) {
  const date = new Date(value);
  return <time dateTime={date.toISOString()}>{dateFormat.format(date)} · {timeFormat.format(date)} IST</time>;
}
function DateTile({ value }: { value: Date | string }) {
  const date = new Date(value);
  return <div className="club-date-tile" aria-hidden="true">
    <span>{new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).format(date)}</span>
    <strong>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" }).format(date)}</strong>
  </div>;
}
export function StudentDashboard({
  user, myRegistrations = [], upcomingEvents = [], myApplication, myCertificates = [], attendedCount = 0,
}: StudentDashboardProps) {
  const nextEvent = myRegistrations[0];
  const application = myApplication ? describeApplicationStatus(myApplication.status) : null;
  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const canApply = ["outsider", "user", "applicant"].includes(user.role);
  const suggestedEvents = upcomingEvents.filter(event => !myRegistrations.some(reg => reg.eventId === event.id));

  return <div className="club-home">
    <header className="club-page-heading">
      <div><p className="club-eyebrow">Your Student Developer Club</p>
        <h1>Good to see you, {firstName}.</h1>
        <p>A place to learn together, make things, and find your next event.</p>
      </div>
      <Link href="/events" className="club-button">Explore events<ArrowRight size={17} aria-hidden="true" /></Link>
    </header>

    <div className="club-home-columns">
      <div className="club-home-primary">
        <section aria-labelledby="next-event-heading" className="club-next-event" id="my-events">
          <div className="club-section-heading"><h2 id="next-event-heading">Up next for you</h2><span className="club-eyebrow">Your agenda</span></div>
          {nextEvent ? <div className="club-ticket">
            <DateTile value={nextEvent.eventStartsAt} />
            <div className="club-ticket-detail">
              <span className="club-status">{nextEvent.status === "waitlist" ? "On the waitlist" : nextEvent.status === "checked_in" ? "Checked in" : "You're registered"}</span>
              <h3><Link href={"/events/" + nextEvent.eventSlug}>{nextEvent.eventTitle}</Link></h3>
              <p><EventDate value={nextEvent.eventStartsAt} /></p>
              <p><MapPin size={14} aria-hidden="true" />{nextEvent.eventLocation || "Location to be announced"}</p>
              {nextEvent.status === "waitlist" ? <p>You'll get a notification if a place opens. A pass will be available once your place is confirmed.</p> :
                <Link href={"/passes/" + nextEvent.eventId} className="club-button"><QrCode size={17} aria-hidden="true" />Open event pass</Link>}
            </div>
          </div> : <div className="club-first-event">
            <CalendarDays size={28} aria-hidden="true" />
            <h3>Your first event starts here.</h3>
            <p>Browse workshops and meetups, choose something you're curious about, and register. Your event details and pass will appear here.</p>
            <Link href="/events" className="club-text-link">Find an event<ArrowRight size={16} aria-hidden="true" /></Link>
          </div>}
          {myRegistrations.length > 1 && <ul className="club-agenda">
            {myRegistrations.slice(1).map(reg => <li key={reg.eventId}>
              <div><Link href={"/events/" + reg.eventSlug}>{reg.eventTitle}</Link><p><EventDate value={reg.eventStartsAt} /></p></div>
              <Link className="club-text-link" href={reg.status === "waitlist" ? "/events/" + reg.eventSlug : "/passes/" + reg.eventId}>
                {reg.status === "waitlist" ? "Waitlisted" : "Open pass"}<ArrowRight size={15} aria-hidden="true" />
              </Link>
            </li>)}
          </ul>}
        </section>

        <section aria-labelledby="discover-heading">
          <div className="club-section-heading"><h2 id="discover-heading">Coming up at SDC</h2><Link href="/events" className="club-text-link">View all<ArrowRight size={15} aria-hidden="true" /></Link></div>
          {suggestedEvents.length ? <ul className="club-event-list">
            {suggestedEvents.map(event => <li key={event.id}>
              <Link href={"/events/" + event.slug} className="club-event-link">
                <DateTile value={event.startsAt} />
                <div><span className="club-eyebrow">{event.type || "Club event"}</span><h3>{event.title}</h3><p><EventDate value={event.startsAt} /></p><p>{event.location || "Location to be announced"}</p></div>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </li>)}
          </ul> : <div className="club-quiet-state"><p>No other upcoming events are listed yet.</p><p>New events will appear here when the club publishes them.</p></div>}
        </section>

        <section aria-labelledby="certificates-heading">
          <div className="club-section-heading"><h2 id="certificates-heading">Your certificates</h2><Link href="/certificates" className="club-text-link">View all<ArrowRight size={15} aria-hidden="true" /></Link></div>
          {myCertificates.length ? <ul className="club-certificate-list">
            {myCertificates.map(certificate => <li key={certificate.id}><Award size={20} aria-hidden="true" /><div>
              <Link href={"/verify/" + certificate.verifyId}>{typeof certificate.data?.eventName === "string" ? certificate.data.eventName : "Event certificate"}</Link>
              <p>{certificate.issuedAt ? "Issued " + dateFormat.format(new Date(certificate.issuedAt)) : "Issued by the club"}</p>
            </div><ArrowRight size={16} aria-hidden="true" /></li>)}
          </ul> : <div className="club-quiet-state"><p>Your participation belongs here.</p><p>After you attend an eligible event, certificates appear here once the organizer issues them.</p></div>}
          {attendedCount > 0 && <p className="club-footnote">You've checked in to {attendedCount} {attendedCount === 1 ? "event" : "events"}.</p>}
        </section>
      </div>

      <aside className="club-home-aside">
        <section className="club-start-guide" aria-labelledby="start-heading">
          <p className="club-eyebrow">Make yourself at home</p><h2 id="start-heading">Start with these.</h2>
          <ol className="club-checklist">
            <li><span className="club-step-done"><Check size={16} aria-hidden="true" /></span><div><strong>Account created</strong><p>You're ready to explore the club.</p></div></li>
            <li><span className={user.username ? "club-step-done" : "club-step"}>{user.username ? <Check size={16} aria-hidden="true" /> : <UserRound size={16} aria-hidden="true" />}</span><div><Link href="/settings">Introduce yourself</Link><p>{user.username ? "Your profile has a username." : "Add a username and your interests so people can find you."}</p></div></li>
            <li><span className={myRegistrations.length || attendedCount ? "club-step-done" : "club-step"}>{myRegistrations.length || attendedCount ? <Check size={16} aria-hidden="true" /> : <CalendarDays size={16} aria-hidden="true" />}</span><div><Link href="/events">Join an event</Link><p>Pick a workshop or meetup that interests you.</p></div></li>
          </ol>
          <Link className="club-text-link" href="/setup">How the club works<ArrowRight size={15} aria-hidden="true" /></Link>
        </section>

        {(application || canApply) && <section className="club-team-note" aria-labelledby="team-heading">
          <p className="club-eyebrow">Club membership</p><h2 id="team-heading">{application ? "Your membership application" : "Become a member."}</h2>
          {application ? <><span className="club-status">{application.label}</span><p>{application.description}</p><Link href="/notifications" className="club-text-link">Check updates<ArrowRight size={16} aria-hidden="true" /></Link></> :
            <><p>Tell us your interests and how you'd like to contribute. The club reviews your application before granting membership.</p><Link href="/recruitment/apply" className="club-text-link">Apply for membership<ArrowRight size={16} aria-hidden="true" /></Link><p className="club-footnote">Participants can attend public events while waiting for approval.</p></>}
        </section>}
      </aside>
    </div>
  </div>;
}
