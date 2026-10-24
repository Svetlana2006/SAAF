"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Chip, Header, Panel } from "@saaf/ui/institutional/InstitutionUI";

type Application = { applicationId: string; status: string; createdAt: string; email: string; phone: string; contactPerson: string; name?: string; organizationName?: string; address?: string; registrationNumber?: string | null; expertiseAreas?: string[] };
type Queue = { ngoApplications: Application[]; csrApplications: Application[] };

export default function PartnerApplicationsPage() {
  const [queue, setQueue] = useState<Queue>({ ngoApplications: [], csrApplications: [] });
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [busy, setBusy] = useState(""); const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    try { const response = await fetch("/api/admin/partner-applications"); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load applications."); setQueue(data); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Network error loading applications."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  async function decide(type: "ngo" | "csr", applicationId: string, decision: "approve" | "reject") {
    const key = `${type}:${applicationId}`; setBusy(key); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/partner-applications/${encodeURIComponent(applicationId)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, decision }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not update the application.");
      setNotice(decision === "approve" ? (data.invitationSent ? "Approved. Supabase sent an account invitation to the contact email." : "Approved and linked to the existing Supabase account.") : "Application rejected."); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Network error updating application."); }
    finally { setBusy(""); }
  }
  function card(application: Application, type: "ngo" | "csr") {
    const key = `${type}:${application.applicationId}`;
    return <Panel key={key}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><div><Chip tone="blue">{type.toUpperCase()}</Chip><h2>{application.name ?? application.organizationName}</h2><p>{application.contactPerson} · {application.email} · {application.phone}</p><p>{application.address ?? application.registrationNumber ?? "Registration number not supplied"}</p>{application.expertiseAreas?.length ? <small>Expertise: {application.expertiseAreas.join(", ")}</small> : null}<p><small>Submitted {new Date(application.createdAt).toLocaleString()}</small></p></div><div style={{ display: "flex", gap: 8 }}><Button disabled={busy === key} onClick={() => void decide(type, application.applicationId, "approve")}>{busy === key ? "Working…" : "Approve & invite"}</Button><Button variant="danger" disabled={busy === key} onClick={() => void decide(type, application.applicationId, "reject")}>Reject</Button></div></div></Panel>;
  }
  const pendingNgo = queue.ngoApplications.filter(item => item.status === "pending"); const pendingCsr = queue.csrApplications.filter(item => item.status === "pending");
  return <><Header eyebrow="Partner onboarding" title="Organization applications" description="Review NGO and CSR partner applications. Approval creates an organization membership and sends a Supabase account invitation." actions={<Button variant="plain" onClick={() => void refresh()}>Refresh</Button>} />
    {error && <Panel><p role="alert">{error}</p></Panel>}{notice && <Panel><p role="status">{notice}</p></Panel>}{loading && <p>Loading applications…</p>}
    {!loading && !error && pendingNgo.length + pendingCsr.length === 0 && <Panel><p>No applications are awaiting review.</p></Panel>}
    {pendingNgo.length > 0 && <><h2>NGO applications ({pendingNgo.length})</h2>{pendingNgo.map(item => card(item, "ngo"))}</>}
    {pendingCsr.length > 0 && <><h2>CSR applications ({pendingCsr.length})</h2>{pendingCsr.map(item => card(item, "csr"))}</>}
  </>;
}
