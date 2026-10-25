"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
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

  const reasonMessage = reason === "membership"
    ? "This login does not have an active NGO membership. Contact your SAAF administrator."
    : reason === "session"
      ? "Your sign-in session could not be validated. Please sign in again."
      : reason === "database"
        ? "The NGO access database is unavailable. Please contact your SAAF administrator."
        : reason === "auth-config"
          ? "NGO sign-in is not configured. Please contact your SAAF administrator."
        : "";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/ngo/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not sign in.");
      router.replace("/"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Please try again.");
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
      <p className={styles.note}>Access is granted directly by your SAAF administrator. Contact them if you need a login.</p>
      <div className={styles.security}><span>●</span> Secure partner access</div>
    </form>
  </main>;
}
