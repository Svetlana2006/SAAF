"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@saaf/platform/supabase/client";

function subscribe(callback: () => void) { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); }
function getReason() { return new URLSearchParams(window.location.search).get("reason") ?? ""; }
function getServerReason() { return ""; }

export default function CsrLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const reason = useSyncExternalStore(subscribe, getReason, getServerReason);
  const [busy, setBusy] = useState(false);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace("/"); router.refresh();
    } catch {
      setError("Unable to sign in. Check your credentials and contact the SAAF administrator if access is needed.");
    } finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 440, margin: "10vh auto", padding: 32, background: "white", borderRadius: 16, boxShadow: "0 12px 40px #10203018" }}>
    <h1>CSR partner sign in</h1>
    {reason === "auth-config" && <p role="alert">CSR sign-in is not configured. Contact the SAAF administrator.</p>}
    {reason === "session" && <p role="status">Your session expired or could not be validated. Please sign in again.</p>}
    {reason === "role" && <p role="alert">This account does not have CSR access. Contact the SAAF administrator.</p>}
    {reason === "signed-out" && <p role="status">You have signed out.</p>}
    {reason === "invite" && <p role="alert">That invitation link is invalid or expired. Contact the SAAF administrator.</p>}
    <p>Use the account provisioned for your organization. Organizations may <Link href="/register">submit an access application</Link>; sign-in accounts are created by the project owner after review.</p>
    <form onSubmit={signIn} style={{ display: "grid", gap: 16 }}>
      <label>Email<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} style={{ padding: 12 }}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
