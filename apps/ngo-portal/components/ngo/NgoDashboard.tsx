"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Button, formatDateTime, Metric, PageHeader, Panel, Tag } from "./NgoUI";
import styles from "./NgoDashboard.module.css";

type Mission = { missionId: string; missionType: string; status: string; priority: string; scheduledDate: string; totalSlots: number; filledSlots: number; location?: { nameArea: string; wardZone: string } | null; missionVolunteers: { missionVolunteerId: string; volunteer: { name: string } }[]; evidences: { evidenceId: string; type: string; photoUrl: string; description?: string | null }[] };
type Dashboard = { metrics: { activeMissions: number; openOpportunities: number; assignedVolunteers: number; fundingReceived: number; claimsSubmitted: number; claimsTotal: number } };

export default function NgoDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const refresh = useCallback(async () => {
    try {
      const [d, m] = await Promise.all([fetch("/api/ngo/dashboard"), fetch("/api/ngo/missions")]);
      if (d.status === 401 || m.status === 401) throw new Error("Your NGO session expired. Sign in again.");
      if (d.status === 403 || m.status === 403) throw new Error("Your account does not have an active NGO membership.");
      if (!d.ok || !m.ok) throw new Error("Could not load NGO operations.");
      const dj = await d.json(); const mj = await m.json(); setError(""); setDashboard(dj); setMissions(mj.missions ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Network error loading operations."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  async function updateStatus(missionId: string, status: string) {
    setBusy(missionId); setError(""); setNotice("");
    try { const r = await fetch(`/api/ngo/missions/${encodeURIComponent(missionId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Status update failed."); setNotice(`Mission moved to ${status}.`); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Network error updating mission."); } finally { setBusy(""); }
  }
  async function uploadEvidence(missionId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const form = new FormData(); form.set("file", file); form.set("type", "after"); form.set("description", "Mission progress evidence");
    setBusy(missionId); setError(""); setNotice("");
    try { const r = await fetch(`/api/ngo/missions/${encodeURIComponent(missionId)}/evidence`, { method: "POST", body: form }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Evidence upload failed."); setNotice("Evidence uploaded."); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Network error uploading evidence."); } finally { setBusy(""); }
  }
  const shown = missions.filter(m => (statusFilter === "all" || m.status === statusFilter) && `${m.missionId} ${m.missionType} ${m.location?.nameArea ?? ""} ${m.location?.wardZone ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeader eyebrow="NGO operations" title="Missions and field progress" description="Live records for the active NGO membership. Mission actions and evidence uploads are scoped to your organization." actions={<Button variant="plain" onClick={() => void refresh()}>Refresh</Button>} />
    {error && <Panel><p role="alert">{error}</p></Panel>}{notice && <Panel><p role="status">{notice}</p></Panel>}
    <div className={styles.metrics}>{dashboard && <>
      <Metric label="Active missions" value={String(dashboard.metrics.activeMissions)} detail="Current NGO scope" />
      <Metric label="Open report opportunities" value={String(dashboard.metrics.openOpportunities)} detail="Awaiting a decision" />
      <Metric label="Assigned volunteers" value={String(dashboard.metrics.assignedVolunteers)} detail="On your NGO missions" />
      <Metric label="Funding received" value={`₹${dashboard.metrics.fundingReceived.toLocaleString("en-IN")}`} detail="Existing recorded funding" />
      <Metric label="Cost claims" value={String(dashboard.metrics.claimsSubmitted)} detail={`₹${dashboard.metrics.claimsTotal.toLocaleString("en-IN")} submitted`} />
    </>}</div>
    <Panel className={styles.controls}>
      <div className={styles.search}>
        <input aria-label="Search missions" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search mission or location"/>
        <select aria-label="Mission status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {[...new Set(missions.map(m => m.status))].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    </Panel>
    {loading && <p className={styles.empty}>Loading NGO missions…</p>}
    {!loading && !error && shown.length === 0 && <Panel className={styles.empty}>No missions match this filter.</Panel>}
    <div className={styles.missionList}>
      {shown.map(m => <Panel key={m.missionId} className={styles.mission}>
        <div className={styles.missionBody}>
          <div className={styles.missionHeader}>
            <div>
              <div className={styles.labels}><Tag tone="blue">{m.status.replaceAll("_", " ")}</Tag><Tag tone="gray">{m.priority}</Tag></div>
              <h2>{m.missionType}</h2>
              <p className={styles.place}>{m.location?.nameArea ?? "Location unavailable"}{m.location?.wardZone ? ` · ${m.location.wardZone}` : ""}</p>
            </div>
            <time className={styles.date} dateTime={m.scheduledDate}>{formatDateTime(m.scheduledDate)}</time>
          </div>
          <div className={styles.missionFooter}>
            <small>{m.filledSlots}/{m.totalSlots} slots filled · {m.missionVolunteers.length} volunteer assignments</small>
            <div className={styles.actions}>
              {m.status === "planned" && <Button onClick={() => void updateStatus(m.missionId, "mobilizing")}>Start mobilization</Button>}
              {m.status === "mobilizing" && <Button onClick={() => void updateStatus(m.missionId, "in_progress")}>Mark in progress</Button>}
              {m.status === "in_progress" && <Button onClick={() => void updateStatus(m.missionId, "review_pending")}>Submit for review</Button>}
              <label className={styles.evidenceUpload}>
                <span>{busy === m.missionId ? "Uploading…" : "Upload evidence"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy === m.missionId} onChange={e => void uploadEvidence(m.missionId, e)} />
              </label>
            </div>
          </div>
          {m.evidences.length > 0 && <div className={styles.evidenceGallery}>{m.evidences.map(ev => <a key={ev.evidenceId} href={ev.photoUrl} target="_blank" rel="noreferrer"><img src={ev.photoUrl} alt={`${ev.type} evidence`} width={96} height={72}/></a>)}</div>}
        </div>
      </Panel>)}
    </div>
  </>;
}
