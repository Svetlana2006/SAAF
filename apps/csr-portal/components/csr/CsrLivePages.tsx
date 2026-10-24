"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Header, Metric, Panel, Chip } from "@saaf/ui/institutional/InstitutionUI";

const money = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

type Dashboard = { organization: { name: string }; metrics: { committedAmount: number; grants: number; activeMissions: number; verifiedImpactReports: number; wasteRemoved: number; volunteerHours: number } };
type Mission = { missionId: string; missionType: string; priority: string; status: string; scheduledDate: string; estimatedCost?: number | null; location: { nameArea: string; wardZone: string; address: string }; ngo: { name: string }; impactReports: { impactId: string; totalWasteRemoved: number; volunteerHours: number; status: string }[]; csrGrants: { grantId: string; amount: number; status: string; notes?: string | null }[] };
type Impact = { impactId: string; totalCleanedLocations: number; totalWasteRemoved: number; volunteerHours: number; recurringHotspotsResolved: number; environmentalBenefits?: string | null; status: string; createdAt: string; mission: { missionId: string; missionType: string; status: string; ngo: { name: string }; location: { nameArea: string; wardZone: string }; csrGrants: { amount: number; status: string }[] } };

function useLoad<T>(url: string, key: string) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch(url, { cache: "no-store" }); const json = await response.json(); if (!response.ok) throw new Error(json.error ?? "Could not load data."); setData(json[key] ?? json); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Network error. Refresh and try again."); }
    finally { setLoading(false); }
  }, [url, key]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  return { data, loading, error, refresh, setError };
}

export function CsrDashboard() {
  const { data, loading, error, refresh } = useLoad<Dashboard>("/api/csr/dashboard", "");
  return <><Header eyebrow="CSR partner workspace" title={data?.organization.name ?? "CSR dashboard"} description="A live view of your organization’s commitments and verified impact records." actions={<Button variant="plain" onClick={() => void refresh()}>Refresh</Button>} />
    {error && <Panel><p role="alert">{error}</p></Panel>}{loading && <p>Loading organization data…</p>}
    {data && <><div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Metric label="Committed support" value={money(data.metrics.committedAmount)} detail="Recorded commitments; no payment processing"/><Metric label="Missions supported" value={String(data.metrics.grants)} detail="Organization-scoped grant records" tone="blue"/><Metric label="Active supported missions" value={String(data.metrics.activeMissions)} detail="Not marked completed" tone="mint"/><Metric label="Verified impact reports" value={String(data.metrics.verifiedImpactReports)} detail="Submitted for supported missions"/><Metric label="Waste removed" value={`${data.metrics.wasteRemoved.toLocaleString("en-IN")} kg`} detail="Reported in impact records" tone="blue"/><Metric label="Volunteer hours" value={data.metrics.volunteerHours.toLocaleString("en-IN")} detail="Reported in impact records" tone="mint"/></div>
      {data.metrics.grants === 0 && <Panel><p>Your organization has no mission commitments yet. Open <a href="/missions">Missions & commitments</a> to review active NGO missions.</p></Panel>}</>}
  </>;
}

export function CsrMissions() {
  const available = useLoad<Mission[]>("/api/csr/missions?view=available", "missions");
  const supported = useLoad<Mission[]>("/api/csr/missions?view=supported", "missions");
  const [amounts, setAmounts] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(""); const [notice, setNotice] = useState("");
  async function commit(event: FormEvent<HTMLFormElement>, missionId: string) {
    event.preventDefault(); setBusy(missionId); setNotice(""); available.setError("");
    const amount = Number(amounts[missionId]);
    try { const response = await fetch("/api/csr/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId, amount }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Commitment could not be recorded."); setNotice(`Commitment recorded for ${missionId}. This records intent only; it does not transfer funds.`); setAmounts(prev => ({ ...prev, [missionId]: "" })); await Promise.all([available.refresh(), supported.refresh()]); }
    catch (cause) { available.setError(cause instanceof Error ? cause.message : "Network error recording commitment."); }
    finally { setBusy(""); }
  }
  return <><Header eyebrow="CSR partner workspace" title="Missions & commitments" description="Review active NGO missions and record your organization’s funding commitment. No funds move through this portal." actions={<Button variant="plain" onClick={() => void Promise.all([available.refresh(), supported.refresh()])}>Refresh</Button>} />
    {available.error && <Panel><p role="alert">{available.error}</p></Panel>}{notice && <Panel><p role="status">{notice}</p></Panel>}
    <h2>Active missions open for support</h2>{available.loading && <p>Loading missions…</p>}{!available.loading && available.data?.length === 0 && <Panel><p>There are no active missions available for support right now.</p></Panel>}
    {available.data?.map(mission => <Panel key={mission.missionId}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><Chip tone="blue">{mission.status}</Chip> <Chip tone="gray">{mission.priority}</Chip><h3>{mission.missionType}</h3><p>{mission.location.nameArea} · {mission.location.wardZone} · {mission.ngo.name}</p><small>{mission.missionId} · Scheduled {new Date(mission.scheduledDate).toLocaleDateString()}</small>{mission.estimatedCost != null && <p>Estimated mission cost: {money(mission.estimatedCost)}</p>}</div></div>
      <form onSubmit={event => void commit(event, mission.missionId)} style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 12, flexWrap: "wrap" }}><label>Commitment amount (₹)<input aria-label={`Commitment amount for ${mission.missionId}`} required type="number" min="1" step="1" value={amounts[mission.missionId] ?? ""} onChange={event => setAmounts(prev => ({ ...prev, [mission.missionId]: event.target.value }))}/></label><Button disabled={busy === mission.missionId}>{busy === mission.missionId ? "Saving…" : "Record commitment"}</Button></form></Panel>)}
    <h2>Already supported by your organization</h2>{supported.loading && <p>Loading supported missions…</p>}{!supported.loading && supported.data?.length === 0 && <Panel><p>Your organization has not committed support to a mission yet.</p></Panel>}
    {supported.data?.map(mission => <Panel key={mission.missionId}><Chip>{mission.status}</Chip><h3>{mission.missionType}</h3><p>{mission.location.nameArea} · {mission.ngo.name} · {mission.missionId}</p>{mission.csrGrants.map(grant => <p key={grant.grantId}>Commitment: {money(grant.amount)} · {grant.status}</p>)}</Panel>)}
  </>;
}

export function CsrImpact() {
  const { data, loading, error, refresh } = useLoad<Impact[]>("/api/csr/impact", "reports");
  return <><Header eyebrow="CSR partner workspace" title="Verified impact" description="Impact reports attached to missions supported by your organization." actions={<Button variant="plain" onClick={() => void refresh()}>Refresh</Button>} />
    {error && <Panel><p role="alert">{error}</p></Panel>}{loading && <p>Loading verified impact…</p>}{!loading && data?.length === 0 && <Panel><p>No impact reports have been submitted for your supported missions yet.</p></Panel>}
    {data?.map(report => <Panel key={report.impactId}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><Chip tone={report.status === "verified" ? "green" : "blue"}>{report.status}</Chip><h2>{report.mission.missionType}</h2><p>{report.mission.location.nameArea} · {report.mission.location.wardZone} · {report.mission.ngo.name}</p><small>{report.mission.missionId} · Reported {new Date(report.createdAt).toLocaleString()}</small></div><div><b>{money(report.mission.csrGrants.reduce((sum, grant) => sum + grant.amount, 0))}</b><small> Your recorded support</small></div></div><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Waste removed" value={`${report.totalWasteRemoved.toLocaleString("en-IN")} kg`} detail="Reported total"/><Metric label="Volunteer hours" value={String(report.volunteerHours)} detail="Reported total" tone="blue"/><Metric label="Locations cleaned" value={String(report.totalCleanedLocations)} detail="Reported total" tone="mint"/><Metric label="Hotspots resolved" value={String(report.recurringHotspotsResolved)} detail={report.environmentalBenefits ?? "No additional notes"}/></div></Panel>)}
  </>;
}
