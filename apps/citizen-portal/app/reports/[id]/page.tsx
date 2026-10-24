"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Report = { reportId: string; category: string; severity: string; status: string; createdAt: string; reporterName?: string | null; isAnonymous: boolean; location?: { nameArea: string; wardZone: string } | null; images: { imageId: string; photoUrl: string }[] };
export default function PublicReportDetailPage() {
  const params = useParams<{ id: string }>(); const [report, setReport] = useState<Report | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch(`/api/reports/${encodeURIComponent(params.id)}/public`).then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error ?? "Report unavailable."); return json.report as Report; }).then(value => { if (active) setReport(value); }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Could not load report."); }); return () => { active = false; }; }, [params.id]);
  return <main style={{ maxWidth: 900, margin: "2rem auto", padding: "1rem" }}><Link href="/">← Community reports</Link><h1>Public report status</h1><p>{report?.isAnonymous ? "The reporter chose to keep their identity private." : "This is a public report."}</p>{error && <p role="alert">{error}</p>}{!error && !report && <p>Loading report…</p>}{report && <article><h2>{report.category}</h2><p>Reference: {report.reportId}</p>{report.reporterName && <p>Submitted by: {report.reporterName}</p>}<p>Status: <strong>{report.status}</strong></p><p>Severity: {report.severity}</p><p>Location: {report.location?.nameArea ?? "Pending"} · {report.location?.wardZone ?? "Zone pending"}</p><p>Submitted: {new Date(report.createdAt).toLocaleString()}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{report.images.map(image => <img key={image.imageId} src={image.photoUrl} alt="Report evidence" style={{ width: 220, height: 160, objectFit: "cover" }} />)}</div></article>}</main>;
}
