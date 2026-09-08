"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { Loader2, Camera, ShieldCheck, Monitor, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/astryx/page-header";
import { UsernameField } from "@/components/auth/username-field";
import { MembershipBadge } from "@/components/app/membership-badge";
import { usernameError } from "@/lib/username-policy";
import { isClubMember } from "@/lib/membership";

export default function SettingsClient({ identity }: { identity: { username: string | null; requestedUsername: string | null; role: string | null } }) {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pictureMessage, setPictureMessage] = useState("");
  const [pictureError, setPictureError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (isPending) return <p role="status" className="club-loading"><Loader2 size={18} aria-hidden="true" />Loading your account…</p>;
  if (!session) return null;
  const user = { ...session.user, ...identity };
  const currentUsername = user.username || "";
  const value = username ?? user.requestedUsername ?? "";
  async function saveUsername(event: React.FormEvent) {
    event.preventDefault();
    const validation = usernameError(value);
    if (validation) { setError(validation); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/users/me/username", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't save your username.");
      await authClient.getSession({ query: { disableCookieCache: true } });
      await refetch();
      setUsername(data.username);
      router.refresh();
      setMessage("Username requested. A club admin must approve it before it becomes your permanent username.");
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn't save your username. Try again."); }
    finally { setSaving(false); }
  }
  async function uploadPicture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPictureError(""); setPictureMessage("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPictureError("Choose a PNG, JPG, or WebP image under 5 MB."); return;
    }
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't upload this image.");
      const result = await authClient.updateUser({ image: data.url });
      if (result.error) throw new Error(result.error.message || "Couldn't save your picture.");
      await refetch();
      setPictureMessage("Profile picture updated.");
    } catch (error) { setPictureError(error instanceof Error ? error.message : "Couldn't update your picture. Try again."); }
    finally { setUploading(false); event.target.value = ""; }
  }
  return <div className="club-settings">
    <PageHeader title="Settings" description="Your identity, membership, and account security." />
    <div className="club-settings-layout">
      <aside className="club-account-summary" aria-label="Your account">
        <div className="club-profile-avatar">{user.image ? <img src={user.image} alt="" width={72} height={72} /> : user.name.slice(0, 2).toUpperCase()}</div>
        <h2>{user.name}</h2><p className="club-field-help break-all">{user.email}</p>
        <MembershipBadge role={user.role || "outsider"} />
        <nav aria-label="Settings sections"><a href="#profile">Profile</a><a href="#username">Username</a><a href="#security">Security</a></nav>
        <Link className="club-text-link" href="/setup">Membership guide<ArrowUpRight size={14} aria-hidden="true" /></Link>
      </aside>
      <div className="club-settings-sections">
        <section className="club-settings-panel" id="profile" aria-labelledby="profile-title">
          <div className="club-panel-heading"><Camera size={19} aria-hidden="true" /><div><h2 id="profile-title">Your profile</h2><p>Help the team recognize you.</p></div></div>
          <dl className="club-account-details"><div><dt>Full name</dt><dd>{user.name}</dd></div><div><dt>Email address</dt><dd>{user.email}<span className="club-status">{user.emailVerified ? "Email verified" : "Verification needed"}</span></dd></div></dl>
          <div className="club-field"><label htmlFor="profile-picture">Profile picture</label><p className="club-field-help" id="picture-help">PNG, JPG, or WebP · up to 5 MB. A square image works best.</p><input type="file" id="profile-picture" accept="image/png,image/jpeg,image/webp" aria-describedby="picture-help" onChange={uploadPicture} disabled={uploading || !user.emailVerified} /></div>
          {uploading && <p role="status" className="club-field-help">Uploading your picture…</p>}
          {pictureMessage && <p role="status" className="club-form-success">{pictureMessage}</p>}
          {pictureError && <p role="alert" className="club-form-error">{pictureError}</p>}
        </section>
        <section className="club-settings-panel" id="username" aria-labelledby="username-title">
          <div className="club-panel-heading"><span aria-hidden="true">@</span><div><h2 id="username-title">Your club username</h2><p>A consistent identity inside the community.</p></div></div>
          {currentUsername ? <div className="club-field"><label htmlFor="approved-username">Username</label><input id="approved-username" value={currentUsername} readOnly /><p className="club-field-help">Your approved member username is permanent. Other people can see it only if they are club members.</p></div> : !isClubMember(user.role) ? <div><p className="club-field-help">Participants don't have a club username. Request one when you enroll as a member; approval makes it permanent.</p><Link href="/recruitment/apply" className="club-button mt-4">Enroll as a Member</Link></div> : <form className="space-y-5" onSubmit={saveUsername}>
            <UsernameField value={value} onChange={next => { setUsername(next); setMessage(""); setError(""); }} currentValue={currentUsername} disabled={saving || !user.emailVerified} />
            <p className="club-field-help">{user.requestedUsername ? `Pending approval: @${user.requestedUsername}. ` : ""}Once an admin approves your choice, it cannot be changed.</p>
            {message && <p role="status" className="club-form-success">{message}</p>}
            {error && <p role="alert" className="club-form-error">{error}</p>}
            <button className="club-button" disabled={saving || !value || !user.emailVerified}>{saving ? "Requesting…" : "Request username"}</button>
          </form>}
        </section>
        <section className="club-settings-panel" id="security" aria-labelledby="security-title">
          <div className="club-panel-heading"><ShieldCheck size={19} aria-hidden="true" /><div><h2 id="security-title">Security</h2><p>Keep control of your account and devices.</p></div></div>
          <div className="club-settings-row"><div><h3>Password</h3><p>Request an email link to choose a new password.</p></div><Link href="/forgot-password" className="club-button club-button-secondary">Reset password</Link></div>
          <div className="club-settings-row"><div><h3>Optional face check-in</h3><p>You can keep using your event QR pass without enrolling.</p></div><Link href="/settings/face-enrollment" className="club-text-link">Manage enrollment<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          <ActiveSessions currentToken={session.session.token} />
        </section>
      </div>
    </div>
  </div>;
}

type DeviceSession = { id: string; token: string; userAgent?: string | null; createdAt: Date; ipAddress?: string | null };
function ActiveSessions({ currentToken }: { currentToken: string }) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [pending, setPending] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function load() {
    setPending(true); setError("");
    try {
      const result = await authClient.listSessions();
      if (result.error) throw new Error();
      setSessions(result.data || []);
    } catch { setError("Couldn't load your devices. Try again."); }
    finally { setPending(false); }
  }
  useEffect(() => { void load(); }, []);
  async function revoke(token: string | null) {
    setBusy(token || "others"); setError("");
    try {
      const result = token ? await authClient.revokeSession({ token }) : await authClient.revokeOtherSessions();
      if (result.error) throw new Error();
      setSessions(previous => previous.filter(item => token ? item.token !== token : item.token === currentToken));
    } catch { setError("Couldn't sign out that device. Try again."); }
    finally { setBusy(null); }
  }
  return <div className="club-device-section">
    <div className="club-section-heading"><h3>Signed-in devices</h3><button className="club-text-link" disabled={pending || !!busy || sessions.filter(item => item.token !== currentToken).length === 0} onClick={() => revoke(null)}>Sign out other devices</button></div>
    {pending && <p role="status">Loading devices…</p>}
    {error && <div role="alert" className="club-form-error">{error}<button className="club-text-link" onClick={load}>Try again</button></div>}
    <ul className="club-device-list">{sessions.map(item => <li key={item.id}><Monitor size={19} aria-hidden="true" /><div><strong>{item.userAgent?.includes("Mobile") ? "Mobile browser" : "Web browser"}</strong><p title={item.userAgent || undefined}>{item.ipAddress || "Address unavailable"} · Started {new Date(item.createdAt).toLocaleDateString()}</p></div>{item.token === currentToken ? <span className="club-status">This device</span> : <button className="club-button club-button-secondary" disabled={!!busy} onClick={() => revoke(item.token)}>{busy === item.token ? "Signing out…" : "Sign out"}</button>}</li>)}</ul>
  </div>;
}
