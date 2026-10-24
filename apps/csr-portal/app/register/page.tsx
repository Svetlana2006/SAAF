"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "./register.module.css";

export default function CsrRegisterPage() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [submitted, setSubmitted] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSubmitted("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(["organizationName", "contactPerson", "email", "phone", "registrationNumber"].map(key => [key, String(form.get(key) ?? "")]));
    try {
      const response = await fetch("/api/partners/csr-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Application could not be submitted.");
      setSubmitted(result.applicationId); formElement.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Network error. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}><section className={styles.card}><small className={styles.eyebrow}>SAAF CSR partner access</small><h1>Register your organization</h1><p>Submit your organization for review. Approved contacts receive a secure sign-in invitation.</p>
    {submitted ? <p className={styles.success} role="status">Application received. Reference: {submitted}. We’ll email the contact after review.</p> : <form onSubmit={submit}>
      <label>Organization name<input name="organizationName" required minLength={2} maxLength={160}/></label><label>Contact person<input name="contactPerson" required minLength={2} maxLength={120}/></label><label>Work email<input name="email" type="email" required maxLength={254}/></label><label>Phone<input name="phone" type="tel" required minLength={7} maxLength={30}/></label><label>Registration number (optional)<input name="registrationNumber" maxLength={80}/></label>
      {error && <p className={styles.error} role="alert">{error}</p>}<button disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</button>
    </form>}<p className={styles.note}><Link href="/login">Already have an account? Sign in</Link></p>
  </section></main>;
}
