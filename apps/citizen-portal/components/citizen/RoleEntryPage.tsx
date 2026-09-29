import Link from "next/link";
import { Eyebrow, Icon, PortalFooter, PortalHeader } from "./PortalShell";
import styles from "./RoleEntryPage.module.css";

export default function RoleEntryPage() {
  return <div className={styles.page}><PortalHeader active="Hub Overview" />
    <main className={styles.main}>
      <div className={styles.utilityLine}><span className={styles.security}>● RBAC Security Level 4</span><span>│</span><b>NCT CIVIC OPERATING GRID</b><span className={styles.alignRight}>♧ DigiLocker &amp; Parichay Ready　 Active Nodes: 272 Wards</span></div>
      <div className={styles.heading}><span className={styles.framework}>♙ Delhi NCT Urban Sanitation Modernization Framework</span><h1>Select Your Operational Role</h1><p>Choose your accredited tier to access specialized workspaces, ward-level telemetry, field dispatch pipelines, or cryptographically verified SLA ledgers across the National Capital Territory.</p></div>
      <div className={styles.selectorLabel}>PRIMARY PORTAL SELECTOR (QUICK SWITCH)</div>
      <details className={styles.selector}><summary><Icon>♙</Icon><span><b>Select your operating credential…</b><small>Citizen • NGO • CSR Sponsor • Municipal Authority</small></span><small>Press 1–4　⌄</small></summary><div><Link href="/portal">Citizen Portal</Link><Link href="/portal">Continue as Citizen　→</Link></div></details>
      <section className={styles.citizenCard}>
        <div className={styles.cardTop}><Icon>▧</Icon><span className={styles.tier}>Public Tier</span></div>
        <h2>Citizen</h2><p>Empowering residents across 12 zones with instant verification tools and verified civic action tickets.</p>
        <ul><li>Geotagged Multi-Angle Incident Capture</li><li>AI Authenticity &amp; Anti-Spoof Verification</li><li>Community Follow-up Confirmation Gate</li><li>Safai Corps Weekend Volunteer Roster</li></ul>
        <Link href="/portal" className={styles.continue}>Continue as Citizen <span>→</span></Link>
      </section>
      <section className={styles.health}><div className={styles.healthTitle}><div><Eyebrow>DELHI NCT NETWORK HEALTH</Eyebrow><b>Real-Time Grid Status Across 12 Administrative Zones</b></div><small>● Telemetry Active · Latency 240ms</small></div><div className={styles.healthStats}>{[["ACTIVE WARDS","272 / 272","✓ 100% On-grid"],["24H RESOLVED SLA","94.8%","↗ +3.2% vs last week"],["ACTIVE NGO CREWS","142","♙ 1,890 sanitarians"],["CSR ESCROW ALLOCATED","₹4.82 Cr","▣ 38 Active missions"]].map(([k,v,d])=><div key={k}><small>{k}</small><b>{v}</b><span>{d}</span></div>)}</div></section>
      <section className={styles.verify}><Icon tone="blue">?</Icon><div><b>Need Institutional Role Accreditation?</b><span>NGOs and Corporate CSR departments must complete one-time verification via MCD Darpan or MCA CIN registry.</span></div><Link href="/portal">Verify DigiLocker</Link><Link href="/portal" className={styles.green}>Request Accreditation</Link></section>
    </main><PortalFooter compact />
  </div>;
}
