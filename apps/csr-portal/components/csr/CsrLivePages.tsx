"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { csrCommittableMissionStatuses } from "@saaf/platform/csr-policy";
import { Button, Header, Metric, Panel, Chip } from "@saaf/ui/institutional/InstitutionUI";

const money = (value: number | null | undefined) => value == null ? "Unavailable" : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
type Dashboard = { organization: { name: string }; reportingPeriod: string; metrics: { committedAmount: number; allocatedAmount: number; approvedFundingBudget: number | null; availableFunding: number | null; overAllocatedAmount: number | null; supportedMissions: number; inProgressMissions: number; completedMissions: number; verifiedImpactReports: number; grantRecords: number; reportedWasteRemovedKg: number; reportedVolunteerHours: number }; followUp: { windowDays: number; eligibleMissions: number; missionsWithNoRecordedRepeatReports: number; repeatReports: number; completionTimestampsUnavailable: number } };
type Evidence = { evidenceId: string; type: string; photoUrl: string; description: string | null; timestamp: string; verified: boolean; verifiedBy: string | null };
type Grant = { grantId: string; amount: number; status: string; notes: string | null; createdAt: string; authorizedBy?: string | null };
type Mission = { missionId: string; missionType: string; priority: string; status: string; scheduledDate: string; estimatedCost: number | null; actualCost: number | null; isActive: boolean; reportId: string | null; supportedByOrganization: boolean; location: { locationId: string; nameArea: string; wardZone: string; address: string; isHotspot: boolean }; ngo: { ngoId: string; name: string }; report: { reportId: string; category: string; status: string; createdAt: string } | null; impactReports: { impactId: string; totalWasteRemoved: number; volunteerHours: number; status: string; createdAt: string }[]; evidences: Evidence[]; missionActivities: { activityId: string; status: string; progressPercent: number | null; createdAt: string }[]; statusEvents: { fromStatus: string | null; toStatus: string; createdAt: string }[]; csrGrants: Grant[] };
type Impact = { impactId: string; totalCleanedLocations: number; totalWasteRemoved: number; volunteerHours: number; recurringHotspotsResolved: number; environmentalBenefits: string | null; status: string; createdAt: string; mission: { missionId: string; missionType: string; status: string; ngo: { name: string }; location: { nameArea: string; wardZone: string }; report: { reportId: string; category: string; status: string; citizenConfirmations: { status: string }[] } | null; csrGrants: { amount: number; status: string }[]; evidences: { type: string; verified: boolean }[] } };

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const json = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again to continue." : json.error ?? "Could not load data.");
  return json;
}

export function CsrDashboard() {
  const [data, setData] = useState<Dashboard | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const refresh = useCallback(async () => { setLoading(true); try { setData(await fetchJson<Dashboard>("/api/csr/dashboard")); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load dashboard."); } finally { setLoading(false); } }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  return <><Header eyebrow="CSR partner workspace" title={data?.organization.name ?? "CSR dashboard"} description="Organization-scoped commitments, mission activity, and submitted impact records." actions={<Button variant="plain" onClick={() => void refresh()}>Refresh</Button>} />
    {error && <Panel><p role="alert">{error} {error.includes("session expired") && <a href="/login">Sign in</a>}</p></Panel>}{loading && <p role="status">Loading organization records…</p>}
    {data && <><p>{data.reportingPeriod}</p><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Metric label="Committed" value={money(data.metrics.committedAmount)} detail="Active internal commitment records; no payment" />
      <Metric label="Allocated" value={money(data.metrics.allocatedAmount)} detail="Recorded allocations; same ledger as commitments" tone="blue" />
      <Metric label="Approved commitment budget" value={money(data.metrics.approvedFundingBudget)} detail="Set by an administrator during CSR approval" tone="blue" />
      <Metric label="Remaining available funding" value={money(data.metrics.availableFunding)} detail="Approved budget less active recorded commitments" tone="mint" />
      <Metric label="Funded missions" value={String(data.metrics.supportedMissions)} detail={`${data.metrics.grantRecords} recorded commitment(s)`} tone="mint" />
      <Metric label="In progress" value={String(data.metrics.inProgressMissions)} detail="Mission status: in_progress" tone="blue" />
      <Metric label="Completed" value={String(data.metrics.completedMissions)} detail="Mission status: completed" />
      <Metric label="Verified impact reports" value={String(data.metrics.verifiedImpactReports)} detail="Impact report status: verified" tone="mint" />
      <Metric label="Waste removed (reported)" value={`${data.metrics.reportedWasteRemovedKg.toLocaleString("en-IN")} kg`} detail="Submitted impact reports; not all human-verified" tone="blue" />
      <Metric label="Volunteer hours (reported)" value={data.metrics.reportedVolunteerHours.toLocaleString("en-IN")} detail="Submitted impact reports; not all human-verified" tone="mint" />
    </div>{data.metrics.overAllocatedAmount != null && data.metrics.overAllocatedAmount > 0 && <Panel><p role="alert">Recorded commitments exceed the approved budget by {money(data.metrics.overAllocatedAmount)}. New commitments are blocked until an administrator updates the approved budget or recorded commitments are adjusted.</p></Panel>}<Panel><b>30-day repeat-report follow-up</b><p>{data.followUp.eligibleMissions} completed mission(s) have a full 30-day observation window. {data.followUp.repeatReports} reports were recorded at their locations during follow-up; {data.followUp.missionsWithNoRecordedRepeatReports} had no repeat report recorded. This is not a cleanliness certification.</p><small>Completion timestamps unavailable for {data.followUp.completionTimestampsUnavailable} completed mission(s).</small></Panel>{data.metrics.grantRecords === 0 && <Panel><p>Your organization has no commitments recorded. Review eligible mission opportunities on <a href="/missions">Missions & commitments</a>.</p></Panel>}</>}
  </>;
}

export function CsrMissions() {
  const [view, setView] = useState("all"); const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [fundingStatus, setFundingStatus] = useState(""); const [location, setLocation] = useState(""); const [category, setCategory] = useState(""); const [ngo, setNgo] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [page, setPage] = useState(0); const [missions, setMissions] = useState<Mission[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [history, setHistory] = useState<(Grant & { mission: { missionId: string; missionType: string; status: string; estimatedCost: number | null; ngo: { name: string }; location: { nameArea: string; wardZone: string } } })[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(""); const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ view, limit: "30", offset: String(page * 30) });
    for (const [key, value] of Object.entries({ q, status, fundingStatus, location, category, ngo, from, to })) if (value) params.set(key, value);
    try { const [result, grantResult] = await Promise.all([fetchJson<{ missions: Mission[]; page: { total: number } }>(`/api/csr/missions?${params}`), fetchJson<{ grants: typeof history }>("/api/csr/grants")]); setMissions(result.missions); setTotal(result.page.total); setHistory(grantResult.grants); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load missions."); }
    finally { setLoading(false); }
  }, [view, page, q, status, fundingStatus, location, category, ngo, from, to]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  async function commit(event: FormEvent<HTMLFormElement>, missionId: string) {
    event.preventDefault(); setBusy(missionId); setNotice(""); setError("");
    const amount = Number(amounts[missionId]);
    try { const response = await fetch("/api/csr/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId, amount }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Commitment could not be recorded."); setNotice(`Internal funding record saved for ${missionId}. No funds were transferred.`); setAmounts(value => ({ ...value, [missionId]: "" })); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Network error recording commitment."); }
    finally { setBusy(""); }
  }
  return <><Header eyebrow="CSR partner workspace" title="Funded missions & opportunities" description="Review mission budgets and record organization commitments. All funding records are internal; the portal does not transfer money." actions={<Button variant="plain" onClick={() => void load()}>Refresh</Button>} />
    {notice && <Panel><p role="status">{notice}</p></Panel>}{error && <Panel><p role="alert">{error} {error.includes("session expired") && <a href="/login">Sign in</a>}</p></Panel>}
    <Panel><div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <label>View<select value={view} onChange={e => { setView(e.target.value); setPage(0); }}><option value="all">Eligible and supported</option><option value="available">Available</option><option value="supported">Supported</option></select></label>
      <label>Search<input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Mission, location, NGO" /></label>
      <label>Status<input value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} placeholder="planned, in_progress" /></label>
      <label>Funding status<select value={fundingStatus} onChange={e => { setFundingStatus(e.target.value); setPage(0); }}><option value="">Any</option><option value="committed">Committed</option><option value="released">Released</option><option value="cancelled">Cancelled</option></select></label>
      <label>Category<input value={category} onChange={e => { setCategory(e.target.value); setPage(0); }} /></label>
      <label>Location<input value={location} onChange={e => { setLocation(e.target.value); setPage(0); }} /></label>
      <label>NGO<input value={ngo} onChange={e => { setNgo(e.target.value); setPage(0); }} /></label>
      <label>Scheduled from<input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} /></label>
      <label>Scheduled to<input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} /></label>
    </div></Panel>
    {loading && <p role="status">Loading missions…</p>}{!loading && missions.length === 0 && <Panel><p>No missions match these filters or there are no eligible records.</p></Panel>}
    {missions.map(mission => { const own = mission.csrGrants; const canCommit = mission.isActive && csrCommittableMissionStatuses.includes(mission.status as typeof csrCommittableMissionStatuses[number]); const before = mission.evidences.some(item => item.type === "before"); const after = mission.evidences.some(item => item.type === "after"); const progress = mission.missionActivities.find(item => item.progressPercent != null)?.progressPercent; return <Panel key={mission.missionId}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><Chip tone={mission.status === "completed" ? "green" : "blue"}>{mission.status}</Chip> <Chip tone="gray">{mission.priority}</Chip>{mission.location.isHotspot && <> <Chip tone="yellow">Recorded hotspot</Chip></>}<h2>{mission.missionType}</h2><p>{mission.location.nameArea} · {mission.location.wardZone} · {mission.ngo.name}</p><p>{mission.location.address}</p><small>{mission.missionId} · Scheduled {new Date(mission.scheduledDate).toLocaleDateString()} · Category {mission.report?.category ?? mission.missionType}</small>
        {mission.estimatedCost == null ? <p>Proposed budget unavailable</p> : <p>Proposed mission budget: {money(mission.estimatedCost)}{mission.actualCost != null && ` · Recorded actual cost: ${money(mission.actualCost)}`}</p>}
        {progress != null && <p>Latest activity progress: {progress}% (reported activity value)</p>}
        <p>Verification: {!mission.supportedByOrganization ? "available after a commitment is recorded" : mission.impactReports.some(report => report.status === "verified") ? "verified impact report recorded" : "no verified impact report recorded"} · Before evidence: {!mission.supportedByOrganization ? "not available" : before ? "present" : "missing"} · After evidence: {!mission.supportedByOrganization ? "not available" : after ? "present" : "missing"}</p>
        <p>Linked report: {mission.report ? <a href={`${process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL ?? "http://localhost:3001"}/reports/${encodeURIComponent(mission.report.reportId)}`} target="_blank" rel="noreferrer">{mission.report.reportId} ({mission.report.status})</a> : "Unavailable"}</p>
        <p>Impact records: {mission.impactReports.length ? mission.impactReports.map((report, index) => <span key={report.impactId}>{index > 0 && ", "}<a href={`/impact#impact-${encodeURIComponent(report.impactId)}`}>{report.impactId} ({report.status})</a></span>) : "Unavailable"}</p>
      </div></div>
      {mission.evidences.length > 0 && <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">{mission.evidences.map(evidence => <a key={evidence.evidenceId} href={evidence.photoUrl} target="_blank" rel="noreferrer"><Image src={evidence.photoUrl} alt={`${evidence.type} mission evidence`} width={320} height={180} unoptimized style={{ width: "100%", height: 140, objectFit: "cover" }} /><small>{evidence.type} · {evidence.verified ? `verified${evidence.verifiedBy ? ` by ${evidence.verifiedBy}` : ""}` : "not verified"}</small></a>)}</div>}
      {own.length > 0 ? own.map(grant => <p key={grant.grantId}>Your organization: {money(grant.amount)} · {grant.status} · recorded {new Date(grant.createdAt).toLocaleString()}{grant.authorizedBy ? ` · user ${grant.authorizedBy}` : ""}</p>) : <p>No commitment from your organization is recorded for this mission.</p>}
      {own.length === 0 && <form onSubmit={event => void commit(event, mission.missionId)} style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 12, flexWrap: "wrap" }}><label>Commitment amount (₹)<input aria-label={`Commitment amount for ${mission.missionId}`} required type="number" min="0.01" step="0.01" max={mission.estimatedCost ?? undefined} disabled={!canCommit || mission.estimatedCost == null} value={amounts[mission.missionId] ?? ""} onChange={event => setAmounts(prev => ({ ...prev, [mission.missionId]: event.target.value }))} /></label><Button disabled={busy === mission.missionId || !canCommit || mission.estimatedCost == null}>{busy === mission.missionId ? "Saving…" : "Record commitment"}</Button></form>}
      {mission.estimatedCost == null && own.length === 0 && <small>Allocation is disabled until an approved proposed budget is recorded.</small>}
    </Panel>; })}
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}><Button variant="soft" disabled={page === 0 || loading} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page + 1} of {Math.max(1, Math.ceil(total / 30))} · {total} mission(s)</span><Button variant="soft" disabled={(page + 1) * 30 >= total || loading} onClick={() => setPage(value => value + 1)}>Next</Button></div>
    <h2>Commitment history</h2>{history.length === 0 && <Panel><p>No funding commitment records yet.</p></Panel>}{history.map(grant => <Panel key={grant.grantId}><b>{grant.mission.missionType}</b><p>{grant.mission.location.nameArea} · {grant.mission.ngo.name} · {grant.mission.status}</p><p>{money(grant.amount)} · {grant.status} · recorded {new Date(grant.createdAt).toLocaleString()}</p></Panel>)}
  </>;
}

export function CsrImpact() {
  const [reports, setReports] = useState<Impact[]>([]); const [followUp, setFollowUp] = useState<{ eligibleMissions: number; missionsWithNoRecordedRepeatReports: number; repeatReports: number; evidenceUnavailable: number; definition: string } | null>(null);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [location, setLocation] = useState(""); const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const params = new URLSearchParams(); for (const [key, value] of Object.entries({ from, to, location, category })) if (value) params.set(key, value);
  const query = params.toString();
  const refresh = useCallback(async () => { setLoading(true); try { const result = await fetchJson<{ reports: Impact[]; followUp: typeof followUp }>(`/api/csr/impact${query ? `?${query}` : ""}`); setReports(result.reports); setFollowUp(result.followUp); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load impact records."); } finally { setLoading(false); } }, [query]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  return <><Header eyebrow="CSR partner workspace" title="Impact & follow-up" description="Submitted impact records for supported missions. Reported metrics are distinguished from verified records." actions={<><Button variant="plain" onClick={() => void refresh()}>Refresh</Button><a href={`/api/csr/impact${query ? `?${query}&` : "?"}format=csv`} download>Export CSV</a></>} />
    {error && <Panel><p role="alert">{error} {error.includes("session expired") && <a href="/login">Sign in</a>}</p></Panel>}{loading && <p role="status">Loading impact data…</p>}
    <Panel><div className="grid grid-cols-2 gap-2 lg:grid-cols-4"><label>Reported from<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>Reported to<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label><label>Location<input value={location} onChange={e => setLocation(e.target.value)} /></label><label>Category<input value={category} onChange={e => setCategory(e.target.value)} /></label></div><small>Filters apply to impact report creation dates, location, and linked report category. The follow-up summary covers all eligible supported completed missions.</small></Panel>
    <small>Showing up to the 500 most recent matching impact records; CSV export uses this same filtered dataset.</small>
    {followUp && <Panel><h2>30-day repeat-report follow-up</h2><p>{followUp.eligibleMissions} completed mission(s) have a completion timestamp and a full 30-day follow-up window. {followUp.missionsWithNoRecordedRepeatReports} had no repeat report recorded; {followUp.repeatReports} repeat report(s) were recorded at their locations in those windows.</p><p>Completion timestamps unavailable for {followUp.evidenceUnavailable} completed mission(s). No cleanliness claim is inferred from mission completion.</p><small>{followUp.definition}</small></Panel>}
    {!loading && reports.length === 0 && <Panel><p>No impact reports have been submitted for your supported missions. Values are not inferred where no report exists.</p></Panel>}
    {reports.map(report => { const evidence = report.mission.evidences; return <Panel key={report.impactId} id={`impact-${report.impactId}`}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><Chip tone={report.status === "verified" ? "green" : "yellow"}>{report.status === "verified" ? "human-verified report" : `reported · ${report.status}`}</Chip><h2>{report.mission.missionType}</h2><p>{report.mission.location.nameArea} · {report.mission.location.wardZone} · {report.mission.ngo.name}</p><small>{report.mission.missionId} · Reported {new Date(report.createdAt).toLocaleString()}</small><p>Related report: {report.mission.report ? `${report.mission.report.reportId} · ${report.mission.report.category} · ${report.mission.report.status}` : "Unavailable"}</p></div><div><b>{money(report.mission.csrGrants.reduce((sum, grant) => sum + grant.amount, 0))}</b><small> Recorded support</small></div></div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Waste removed" value={`${report.totalWasteRemoved.toLocaleString("en-IN")} kg`} detail="Submitted in impact report"/><Metric label="Volunteer hours" value={String(report.volunteerHours)} detail="Submitted in impact report" tone="blue"/><Metric label="Locations cleaned" value={String(report.totalCleanedLocations)} detail="Submitted; not independently verified here" tone="mint"/><Metric label="Hotspots resolved" value={String(report.recurringHotspotsResolved)} detail={report.environmentalBenefits ?? "No supporting note supplied"}/></div>
      <p>Before evidence: {evidence.some(item => item.type === "before") ? "present" : "missing"} · After evidence: {evidence.some(item => item.type === "after") ? "present" : "missing"} · Verified evidence records: {evidence.filter(item => item.verified).length}</p>
      <p>Citizen feedback on linked report: {report.mission.report?.citizenConfirmations.length ? report.mission.report.citizenConfirmations.map(item => item.status).join(", ") : "unavailable"}</p>
    </Panel>; })}
  </>;
}
