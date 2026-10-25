"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@saaf/platform/supabase/client";

function subscribe(callback: () => void) { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); }
function getReason() { return new URLSearchParams(window.location.search).get("reason") ?? ""; }
function getServerReason() { return ""; }

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reason = useSyncExternalStore(subscribe, getReason, getServerReason);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || user?.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        setError("This account does not have the trusted Admin role. Ask the project owner to provision Admin access.");
        return;
      }
      // The Admin dashboard is the root route of the Admin portal (port 3004).
      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to sign in. Check your credentials and contact the SAAF administrator if access is needed.");
    } finally { setBusy(false); }
  }

  return <main style={{ maxWidth: 440, margin: "10vh auto", padding: 32, background: "white", borderRadius: 16, boxShadow: "0 12px 40px #10203018" }}>
    <h1>Municipal Admin sign in</h1>
    <p>Use the account assigned to your municipal team.</p>
    {reason === "auth-config" && <p role="alert">Supabase sign-in is not configured for the Admin portal. Contact the SAAF administrator.</p>}
    {reason === "role" && <p role="alert">This account does not have the trusted Admin role. Contact the project owner.</p>}
    {reason === "session" && <p role="status">Your session could not be validated. Please sign in again.</p>}
    {reason === "invite" && <p role="alert">That invitation link is invalid or expired. Contact the project owner.</p>}
    <form onSubmit={signIn} style={{ display: "grid", gap: 16 }}>
      <label>Email<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} style={{ padding: 12 }}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
