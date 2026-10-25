"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@saaf/platform/supabase/client";

export default function CsrSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true); setError("");
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login?reason=signed-out"); router.refresh();
    } catch { setError("Sign out failed. Please retry."); }
    finally { setBusy(false); }
  }
  return <div style={{ display: "grid", justifyItems: "end", gap: 3 }}><button type="button" onClick={() => void signOut()} disabled={busy} aria-label="Sign out of CSR portal">{busy ? "Signing out…" : "Sign out"}</button>{error && <small role="alert">{error}</small>}</div>;
}
