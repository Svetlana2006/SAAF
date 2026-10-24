"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@saaf/platform/supabase/client";
import styles from "./NgoAccess.module.css";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}
function getLocationReason() { return new URLSearchParams(window.location.search).get("reason") ?? ""; }
function getServerLocationReason() { return ""; }

export default function NgoAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reason = useSyncExternalStore(subscribeToLocation, getLocationReason, getServerLocationReason);

  useEffect(() => {
    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    if (reason === "auth-config" && isConfigured) router.replace("/login");
  }, [reason, router]);

  const reasonMessage = reason === "membership"
    ? "Sign-in succeeded, but this account is not linked to an active NGO yet. An administrator must add its Supabase Auth user ID to NgoMembership."
    : reason === "session"
      ? "The app could not read a Supabase session after sign-in. Check the Supabase URL/key in apps/ngo-portal/.env.local and restart the dev server."
      : reason === "database"
        ? "Supabase sign-in worked, but the NGO database tables are missing or unreachable. Apply the Prisma schema, then try again."
        : reason === "auth-config"
          ? "Supabase URL or publishable key is missing. Check apps/ngo-portal/.env.local and restart the dev server."
        : reason === "invite"
          ? "This invitation link is invalid or expired. Ask the administrator to send a new invitation."
        : "";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace("/"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <form className={styles.card} onSubmit={signIn}>
      <div className={styles.brand}><span className={styles.mark}>↗</span><span className={styles.brandText}><b>SAAF NGO</b><small>MUNICIPAL FIELD PORTAL</small></span></div>
      <small className={styles.eyebrow}>Accredited municipal partner</small>
      <h1 className={styles.title}>Partner sign in</h1>
      <p className={styles.intro}>Sign in to coordinate missions, review citizen reports, and manage your organization’s field work.</p>
      {reasonMessage && <p className={styles.error} role="status">{reasonMessage}</p>}
      <div className={styles.fields}>
        <label className={styles.field}>Work email<input className={styles.input} required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@organization.org" /></label>
        <label className={styles.field}>Password<input className={styles.input} required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} disabled={busy}>{busy ? "Signing in…" : "Sign in to partner portal"}</button>
      </div>
      <p className={styles.note}>New to SAAF? <Link href="/register">Register your NGO for review</Link>. Access is granted after administrator approval.</p>
      <div className={styles.security}><span>●</span> Secure partner access</div>
    </form>
  </main>;
}
