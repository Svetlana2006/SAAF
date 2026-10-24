"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "../login/NgoAccess.module.css";

const inputClass = styles.input;

export default function NgoRegisterPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSubmitted("");
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const payload = {
      name: String(data.get("name") ?? ""), contactPerson: String(data.get("contactPerson") ?? ""),
      email: String(data.get("email") ?? ""), phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""), registrationNumber: String(data.get("registrationNumber") ?? ""),
      expertiseAreas: String(data.get("expertiseAreas") ?? "").split(",").map(value => value.trim()).filter(Boolean),
    };
    try {
      const response = await fetch("/api/partners/ngo-applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Application could not be submitted.");
      setSubmitted(result.applicationId);
      formElement.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Network error. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className={styles.page}><section className={styles.card}>
    <div className={styles.brand}><span className={styles.mark}>↗</span><span className={styles.brandText}><b>SAAF NGO</b><small>MUNICIPAL FIELD PORTAL</small></span></div>
    <small className={styles.eyebrow}>Partner onboarding</small><h1 className={styles.title}>Register your NGO</h1>
    <p className={styles.intro}>Submit your organization details for review. Once approved, the contact person will receive a secure sign-in invitation.</p>
    {submitted ? <p className={styles.success} role="status">Application received. Reference: {submitted}. We’ll email the contact after review.</p> : <form className={styles.fields} onSubmit={submit}>
      <label className={styles.field}>Organization name<input className={inputClass} name="name" required minLength={2} maxLength={160}/></label>
      <label className={styles.field}>Contact person<input className={inputClass} name="contactPerson" required minLength={2} maxLength={120}/></label>
      <label className={styles.field}>Work email<input className={inputClass} name="email" type="email" required maxLength={254}/></label>
      <label className={styles.field}>Phone<input className={inputClass} name="phone" type="tel" required minLength={7} maxLength={30}/></label>
      <label className={styles.field}>Office address<textarea className={inputClass} name="address" required minLength={5} maxLength={300}/></label>
      <label className={styles.field}>Registration number (optional)<input className={inputClass} name="registrationNumber" maxLength={80}/></label>
      <label className={styles.field}>Areas of expertise<input className={inputClass} name="expertiseAreas" required placeholder="Waste cleanup, drainage, awareness"/><small>Separate areas with commas.</small></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.button} disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</button>
    </form>}
    <p className={styles.note}><Link href="/login">Already have an account? Sign in</Link></p>
  </section></main>;
}
