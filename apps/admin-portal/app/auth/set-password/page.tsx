"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@saaf/platform/supabase/client";

export default function AdminSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/");
      router.refresh();
    } catch {
      setError("The invitation session may have expired. Ask the administrator to send a new invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 440, margin: "10vh auto", padding: 32, background: "white", borderRadius: 16, boxShadow: "0 12px 40px #10203018" }}>
      <h1>Set your Admin portal password</h1>
      <p>Choose a strong password to complete your administrator account setup.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>
          New password
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>
        <label>
          Confirm password
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={12}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button disabled={busy} style={{ padding: 12 }}>
          {busy ? "Saving…" : "Set password and continue"}
        </button>
      </form>
    </main>
  );
}

