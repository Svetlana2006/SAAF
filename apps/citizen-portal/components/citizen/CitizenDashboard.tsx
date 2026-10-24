"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eyebrow, PortalFooter, PortalHeader } from "./PortalShell";
import styles from "./CitizenDashboard.module.css";

type Report = { reportId: string; category: string; severity: string; status: string; photoUrl?: string | null; createdAt: string; location?: { nameArea: string; wardZone: string } | null };
type Mission = { id: string; name: string; status: string; spotsLeft: number; wardLabel: string };

export default function CitizenDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    let active = true;
    const reportUrl = `/api/reports?limit=8${statusFilter === "all" ? "" : `&status=${encodeURIComponent(statusFilter)}`}`;
    Promise.all([fetch(reportUrl).then(r => r.ok ? r.json() : Promise.reject()), fetch("/api/volunteers").then(r => r.ok ? r.json() : Promise.reject())])
      .then(([reportJson, missionJson]) => { if (active) { setError(""); setReports(reportJson.data?.reports ?? []); setMissions(missionJson.data ?? []); } })
      .catch(() => { if (active) setError("Community data could not be loaded. Please refresh to try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [statusFilter]);
  const open = reports.filter(r => r.status === "open").length;
  const assigned = reports.filter(r => r.status === "assigned").length;
  return <div className={styles.page}><PortalHeader active="Hub Overview"/><main>
    <section className={styles.welcome}><div className={styles.node}>SAAF Community Portal · Public activity</div><div className={styles.welcomeRow}><div><Eyebrow>CITIZEN ACTION CONSOLE</Eyebrow><h1>Community cleanliness updates</h1><p>Submit an anonymous report or join an active volunteer mission.</p></div><div className={styles.scorecard}><div><b>{loading ? "…" : reports.length}<small>Recent public reports</small></b></div><div><b>{loading ? "…" : missions.length}<small>Open volunteer missions</small></b></div><strong>{loading ? "…" : `${open} open · ${assigned} assigned`}<small>Public status counts</small></strong></div></div></section>
    <section className={styles.actions}>
      <article className={styles.actionCard}><div className={styles.cardHead}><span className={styles.reportPill}>Anonymous community reporting</span></div><h2>Report a sanitation issue</h2><p>Send category, severity, location, notes, and photos to the shared reporting API. Reports are not tied to a citizen account.</p><div className={styles.cardActions}><Link href="/report" className={styles.primary}>Start a report →</Link></div></article>
      <article className={styles.actionCard}><div className={styles.cardHead}><span className={styles.volunteerPill}>Volunteer missions</span></div><h2>Join a mission</h2><p>Browse current missions and register using your own contact details. Volunteer signup is a public, unverified identity workflow.</p><div className={styles.cardActions}><Link href="/volunteer" className={styles.primary}>Explore missions →</Link></div></article>
    </section>
    <section className={styles.feed} id="activity"><div className={styles.feedHeading}><div><h2>Recent public reports</h2><small>This feed is public; it is not a personal report history.</small></div><div><label>Status filter <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All</option><option value="open">Open</option><option value="assigned">Assigned</option><option value="completed">Completed</option></select></label> <Link href="/report">Submit a report</Link></div></div>
      {error && <p role="alert">{error}</p>}{loading && <p>Loading reports…</p>}
      {!loading && !error && reports.length === 0 && <p>No public reports are available yet.</p>}
      <div className={styles.feedRows}>{reports.map(report => <article key={report.reportId}><span className={styles.activityIcon}>{report.status === "completed" ? "✓" : "•"}</span><div><b><Link href={`/reports/${encodeURIComponent(report.reportId)}`}>{report.category} · {report.reportId}</Link></b><small>{report.location?.nameArea ?? "Location pending"} · {report.location?.wardZone ?? "Zone pending"} · {new Date(report.createdAt).toLocaleString()}</small></div><strong>{report.status}</strong><time>{report.severity}</time></article>)}</div>
    </section>
    <section className={styles.feed}><div className={styles.feedHeading}><h2>Volunteer mission availability</h2><Link href="/volunteer">View all missions</Link></div>{loading && <p>Loading missions…</p>}{!loading && missions.length === 0 && <p>No active missions are accepting volunteers.</p>}<div className={styles.feedRows}>{missions.slice(0, 5).map(m => <article key={m.id}><span className={styles.activityIcon}>♧</span><div><b>{m.name}</b><small>{m.wardLabel} · {m.status}</small></div><strong>{m.spotsLeft} spots</strong></article>)}</div></section>
  </main><PortalFooter/></div>;
}
