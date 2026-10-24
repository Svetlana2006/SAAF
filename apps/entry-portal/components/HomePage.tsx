"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { portalUrls } from "@saaf/platform/urls";
import { PublicSiteFooter, PublicSiteHeader } from "./PublicSiteShell";
import styles from "./HomePage.module.css";

const HotspotMap = dynamic(() => import("./HotspotMap"), {
  ssr: false,
  loading: () => <div style={{ height: 460, background: "#0f172a", borderRadius: 12 }} />,
});

const steps=[["01","Spot & Geotag","Multi-angle evidence and verified mobile capture with location, timestamp, and category classification."],["02","Assess & Prioritize","Severity, recurrence, proximity, and material diagnostics help the right team respond."],["03","Act & Document","Accredited local teams record cleanup progress with geotagged before and after evidence."],["04","Follow-up & Audit","Citizens confirm completed work before escrow release and transparent closeout."]];
const roles=[["♧","Citizen Reporter & Volunteer","Submit instant geotagged sanitation hazards in your ward, monitor resolution progression in real time, and join community weekend cleanup drives.",["Sub-60s photo reporting","Earn Civic Impact Badges"],"Access Citizen Portal",portalUrls.citizen + "/login","citizen"],["♟","Grassroots NGO Taskforce","Receive ward-specific cleanup dispatches, orchestrate field crew rosters, verify disposal weighbridge receipts, and claim escrow grants.",["Direct ward dispatch queue","Automated weighbridge logs"],"Taskforce Console",portalUrls.ngo,"ngo"],["▤","CSR & Impact Sponsor","Allocate targeted sanitation grants across specific Delhi pin codes with transparent milestone escrow tracking and SEBI-compliant ESG reports.",["SEBI / RBI-aligned reporting","Tied milestone escrow lock"],"Sponsor Registry",portalUrls.csr,"sponsor"],["▦","Municipal Governance & Admin","City-wide command telemetry across 272 wards, recurrence diagnostics, sanitation contractor penalty audits, and dynamic route tuning.",["Contractor SLA penalty tracking","Ward health analytics engine"],"Enter Command Grid",portalUrls.admin,"admin"]] as const;

type HomeReport = {
  reportId: string;
  category: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  location: { nameArea: string; latitude: number; longitude: number } | null;
};

type HomepageSummary = {
  totalReports: number;
  completedReports: number;
  openReports: number;
  assignedReports: number;
  activeMissions: number;
  urgentReports: number;
  drainReports: number;
  fundingTotal: number;
  citizenApprovalRate: number | null;
  latestReports: HomeReport[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function incidentScore(report: HomeReport) {
  const severity = report.severity.toLowerCase();
  if (severity.includes("critical") || severity.includes("hazard")) return 98;
  if (severity.includes("urgent") || severity.includes("high")) return 90;
  return 78;
}

function reportMapPosition(report: HomeReport) {
  const location = report.location;
  if (!location) return undefined;
  const left = Math.min(94, Math.max(6, ((location.longitude - 76.85) / 0.65) * 100));
  const top = Math.min(90, Math.max(10, ((28.9 - location.latitude) / 0.55) * 100));
  return { left: `${left}%`, top: `${top}%` };
}

export default function HomePage(){
  const [summary, setSummary] = useState<HomepageSummary | null>(null);

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        const response = await fetch("/api/homepage", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (active && result.success && result.data) setSummary(result.data as HomepageSummary);
      } catch {
        // Keep the original layout visible while the live data is unavailable.
      }
    };

    void loadSummary();
    const interval = window.setInterval(loadSummary, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const metrics = [
    ["VERIFIED CLEANS", summary ? summary.completedReports.toLocaleString("en-IN") : "—", summary ? `${summary.totalReports.toLocaleString("en-IN")} reports in the database` : "Loading live report data", "green"],
    ["CSR CAPITAL USED", summary ? formatCurrency(summary.fundingTotal) : "—", "Recorded mission funding", "dark"],
    ["CITIZEN APPROVAL", summary?.citizenApprovalRate == null ? "—" : `${summary.citizenApprovalRate}%`, "Based on submitted confirmations", "green"],
    ["AVG SLA DISPATCH", "—", "SLA timing is not recorded yet", "blue"],
  ] as const;
  const openReports = summary?.latestReports.filter((report) => report.status !== "completed") ?? [];
  const priorityReports = [...openReports].sort((a, b) => incidentScore(b) - incidentScore(a)).slice(0, 3);
  const locatedReports = summary?.latestReports.filter((report) => report.location) ?? [];

  return <div className={styles.page}><PublicSiteHeader/>
  <main>
    <section className={styles.hero}><div className={styles.heroCopy}><div className={styles.pill}><i/> DELHI NCT WARD OPERATING NETWORK <span>·</span><small>Real-time SAAF Grid v2.4</small></div><h1>Spot. Assess.<br/><em>Act. Follow-up.</em></h1><h2>India&apos;s First Verified Urban Sanitation Operating Grid — Delhi NCT Pilot</h2><p>Transforming civic sanitation complaints into verifiable cleanups with cryptographic photo audits, citizen follow-up confirmation, and CSR-backed escrow funding.</p><div className={styles.heroActions}><a href={`${portalUrls.citizen}/report`} className={styles.primary}>▣　Report a Sanitation Hazard</a><Link href="#hotspots" className={styles.secondary}>◎　Explore Live Hotspots Map</Link><Link href="/" className={styles.roleLink}>Select Role &amp; Sign In　→</Link></div><div className={styles.trust}>{[["VALIDATION","256-bit Geofence"],["DISBURSEMENT","Double-Blind Escrow"],["RESPONSE TIER","MCD Ward Priority"]].map(item=><div key={item[0]}><small>{item[0]}</small><b>{item[1]}</b></div>)}</div></div>
      <aside className={styles.telemetry}><header><b>▦　Live Pilot Telemetry</b><Tag>● NCT Zone Sync</Tag></header><div className={styles.metricGrid}>{metrics.map(([label,value,detail,tone])=><article key={label} className={styles[`metric_${tone}`]}><small>{label}</small><b>{value}</b><span>{detail}</span></article>)}</div><div className={styles.proof}><img src="/citizen/home-proof.png" alt="Verified sanitation cleanup evidence"/><div><b><i/> Ward 142 · Nizamuddin West</b><span>2.4T Solid Waste Lifted &amp; Neutralized</span><small>Proof Sealed　 Audit ID #ND-8891</small></div><span>◉</span></div></aside>
    </section>
    <section className={styles.hotspotSection} id="hotspots"><div className={styles.sectionIntro}><div><small>◉ REAL-TIME NCT SPATIAL MATRIX</small><h2>Live Ward Hotspots &amp; SLA Radar</h2><p>Real-time severity clustering across MCD Central, East, South, and North zones.</p></div><div className={styles.mapFilters}><Tag>All Reports ({summary?.totalReports ?? 0})</Tag><Tag tone="red">● Urgent Dumps ({summary?.urgentReports ?? 0})</Tag><Tag tone="blue">● Drain Reports ({summary?.drainReports ?? 0})</Tag><Tag>✓ Verified Cleared ({summary?.completedReports ?? 0})</Tag></div></div><div className={styles.mapLayout}><div className={styles.map}><div className={styles.mapToolbar}><span>Layers:　<b>Severity Heatmap</b>　 Active missions ({summary?.activeMissions ?? 0})　 Drain Corridors</span><span>Updated live</span></div><HotspotMap apiKey={process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""} /></div><aside className={styles.incidents}><header><b>Priority Incidents</b><span>● Auto-Updating</span></header>{summary ? (priorityReports.length > 0 ? priorityReports.map((report) => { const score = incidentScore(report); const tone = score >= 90 ? "red" : "blue"; const locationName = report.location?.nameArea ?? report.category; const reportedDate = new Date(report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); return <article key={report.reportId}><div><Tag tone={tone}>{report.severity} · {report.category}</Tag><b>{score}<small>/100</small></b></div><h3>{locationName}</h3><p>{report.description || `${report.category} reported in ${locationName}.`}</p><footer><span>{report.status === "assigned" ? `Assigned · ${reportedDate}` : `Reported · ${reportedDate}`}</span><b>{report.status === "assigned" ? "Taskforce: Assigned" : "Taskforce: Awaiting"}</b></footer></article>; }) : <p>No open priority reports right now.</p>) : <p>Loading reports from the database…</p>}</aside></div></section>
    <section className={styles.workflow} id="how-it-works"><div className={styles.centerTitle}><small>PROTOCOL ARCHITECTURE</small><h2>The 4-Step Closed-Loop Civic Sanitation Engine</h2><p>A deterministic accountability cycle that eliminates fake resolution receipts and ensures direct escrow compensation<br className={styles.desktopBreak}/> only after independent community validation.</p></div><div className={styles.steps}>{steps.map(([number,title,description],i)=><article key={number}><div className={styles.stepTop}><b>{number}</b><span>{["◎","▣","♧","₹"][i]}</span></div><h3>{title}</h3><p>{description}</p><small>{["◉ EXIF + Delhi Geofence Lock","▣ Dynamic Priority SLA Matrix","▧ Weighbridge Verified Haul","♙ Cryptographic Escrow Payout"][i]}</small></article>)}</div></section>
    <section className={styles.caseStudy}><div className={styles.caseTitle}><Tag>◉ Cryptographic Audit Case Study</Tag><h2>Lajpat Nagar Ring Road Flyover Abutment (Ward 157)</h2><span>Lat: 28.5684° N　·　Lng: 77.2433° E　·　<strong>SLA Met: 2h 45m</strong></span></div><div className={styles.comparison}><figure><img src="/citizen/report-debris.png" alt="Before sanitation cleanup"/><figcaption><Tag tone="red">BEFORE · 14 Oct, 08:32 IST</Tag><span>Citizen Report #DL-9082 · 3.2 Metric Tons Solid Refuse</span></figcaption></figure><figure><img src="/citizen/mission-kashmere.png" alt="After sanitation cleanup"/><figcaption><Tag>AFTER · 14 Oct, 11:17 IST</Tag><span>Executed by Safai Sathi Guild · Approved by 14 Ward Residents</span></figcaption></figure></div></section>
    <section className={styles.roles} id="roles"><div className={styles.sectionIntro}><div><small>MODULAR PARTICIPATION</small><h2>Dedicated Role Portals</h2><p>Tailored consoles designed for field operators, civic monitors, corporate sponsors, and civic executives.</p></div><span>Delhi NCT Sandbox Clearance Tier 1</span></div><div className={styles.roleGrid}>{roles.map(([icon,title,description,features,cta,href,type])=><article key={title} className={styles.roleCard}><div className={styles.roleCardHead}><span className={styles[`roleIcon_${type}`]}>{icon}</span><Tag>{type==="ngo"?"Field Execution":type==="sponsor"?"Impact Funding":type==="admin"?"Command Tier":"Public Tier"}</Tag></div><h3>{title}</h3><p>{description}</p><ul>{features.map(f=><li key={f}>✓　{f}</li>)}</ul><Link href={href}>{cta}<b>→</b></Link></article>)}</div></section>
    <section className={styles.integrity} id="impact"><div><small>◇ GUARANTEED PUBLIC INTEGRITY</small><h2>Open Civic Data API &amp; 256-Bit Geofenced Audit Ledger</h2><p>Every timestamp, geo-coordinate, weighbridge slip, and verified citizen audit receipt is signed cryptographically and indexed on Delhi NCT’s open public sanitation ledger.</p></div><div><a href={portalUrls.citizen}>Explore Public SLA Ledger</a><Link href="/">Download Pilot Whitepaper</Link></div></section>
    <section className={styles.hotline}><span>◉</span><div><small>RAPID BIO-HAZARD LINE</small><h3>Emergency Sanitation Hotline: 1800-SAN-DELHI</h3><p>24/7 MCD bio-hazard &amp; medical refusal rapid dispatch containment team.</p></div><Link href="/volunteer" className={styles.join}>Join Corps →</Link></section>
  </main><PublicSiteFooter/></div>;
}

function Tag({children,tone="green"}:{children:ReactNode;tone?:"green"|"red"|"blue"}){return <span className={`${styles.tag} ${styles[`tag_${tone}`]}`}>{children}</span>}
