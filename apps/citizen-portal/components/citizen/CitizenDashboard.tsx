"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Eyebrow, PortalFooter, PortalHeader } from "./PortalShell";
import styles from "./CitizenDashboard.module.css";

const ReportAreaMap = dynamic(() => import("./ReportAreaMap"), {
  ssr: false,
  loading: () => <p>Loading public report map…</p>,
});

type Report = { reportId: string; category: string; severity: string; status: string; photoUrl?: string | null; createdAt: string; location?: { nameArea: string; wardZone: string; latitude: number; longitude: number } | null };
type Mission = { id: string; name: string; status: string; spotsLeft: number; wardLabel: string };

export default function CitizenDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [missionError, setMissionError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    let active = true;
    const reportUrl = `/api/reports?limit=50${statusFilter === "all" ? "" : `&status=${encodeURIComponent(statusFilter)}`}`;
    const reportRequest = fetch(reportUrl)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((json) => {
        if (active) {
          setReportError("");
          setReports(json.data?.reports ?? []);
        }
      })
      .catch(() => {
        if (active) setReportError("Public reports could not be loaded. Please refresh to try again.");
      });
    const missionRequest = fetch("/api/volunteers")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((json) => {
        if (active) {
          setMissionError("");
          setMissions(json.data ?? []);
        }
      })
      .catch(() => {
        if (active) setMissionError("Volunteer missions could not be loaded. Please refresh to try again.");
      });
    Promise.all([reportRequest, missionRequest]).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [statusFilter]);
  const open = reports.filter(r => r.status === "open").length;
  const assigned = reports.filter(r => r.status === "assigned").length;
  return <div className={styles.page}><PortalHeader active="Hub Overview"/><main>
    <section className={styles.welcome}><div className={styles.node}>SAAF Community Portal · Public activity</div><div className={styles.welcomeRow}><div><Eyebrow>CITIZEN ACTION CONSOLE</Eyebrow><h1>Community cleanliness updates</h1><p>Submit an anonymous report or join an active volunteer mission.</p></div><div className={styles.scorecard}><div><b>{loading ? "…" : reports.length}<small>Reports mapped</small></b></div><div><b>{loading ? "…" : missions.length}<small>Open volunteer missions</small></b></div><strong>{loading ? "…" : `${open} open · ${assigned} assigned`}<small>Public status counts</small></strong></div></div></section>
    <section className={styles.actions}>
      <article className={styles.actionCard}><div className={styles.cardHead}><span className={styles.reportPill}>Anonymous community reporting</span></div><h2>Report a sanitation issue</h2><p>Send category, severity, location, notes, and photos to the shared reporting API. Reports are not tied to a citizen account.</p><div className={styles.cardActions}><Link href="/report" className={styles.primary}>Start a report →</Link></div></article>
      <article className={styles.actionCard}><div className={styles.cardHead}><span className={styles.volunteerPill}>Volunteer missions</span></div><h2>Join a mission</h2><p>Browse current missions and register using your own contact details. Volunteer signup is a public, unverified identity workflow.</p><div className={styles.cardActions}><Link href="/volunteer" className={styles.primary}>Explore missions →</Link></div></article>
    </section>
    <section className={styles.feed} id="activity"><div className={styles.feedHeading}><div><h2>Public report activity by area</h2><small>Map markers show grouped reports at privacy-rounded locations.</small></div><div><label>Status filter <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All</option><option value="open">Open</option><option value="assigned">Assigned</option><option value="completed">Completed</option></select></label> <Link href="/report">Submit a report</Link></div></div>
      {reportError && <p role="alert">{reportError}</p>}{loading && <p>Loading reports…</p>}
      {!loading && !reportError && reports.length === 0 && <p>No public reports are available yet.</p>}
      <ReportAreaMap reports={reports} />
    </section>
    <section className={styles.feed}><div className={styles.feedHeading}><h2>Volunteer mission availability</h2><Link href="/volunteer">View all missions</Link></div>{missionError && <p role="alert">{missionError}</p>}{loading && <p>Loading missions…</p>}{!loading && !missionError && missions.length === 0 && <p>No active missions are accepting volunteers.</p>}<div className={styles.feedRows}>{missions.slice(0, 5).map(m => <article key={m.id}><span className={styles.activityIcon}>♧</span><div><b>{m.name}</b><small>{m.wardLabel} · {m.status}</small></div><strong>{m.spotsLeft} spots</strong></article>)}</div></section>
  </main><PortalFooter/></div>;
}
