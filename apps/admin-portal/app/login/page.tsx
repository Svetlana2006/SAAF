"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@saaf/platform/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    <h1>Municipal Admin sign in</h1>
    <p>Use the account assigned to your municipal team.</p>
    <form onSubmit={signIn} style={{ display: "grid", gap: 16 }}>
      <label>Email<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} style={{ display: "block", width: "100%", padding: 10 }} /></label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} style={{ padding: 12 }}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
