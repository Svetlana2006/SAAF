import { portalUrls } from "@saaf/platform/urls";
import { PublicSiteFooter, PublicSiteHeader } from "./PublicSiteShell";
import styles from "./RoleEntryPage.module.css";

const portals = [
  { icon: "▣", tier: "Public Tier", tone: "citizen", title: "Citizen", description: "Empowering residents across 12 zones with instant verification tools and verified civic action tickets.", features: ["Geotagged multi-angle incident capture", "Community follow-up confirmation", "Weekend volunteer roster"], label: "Continue as Citizen", href: portalUrls.citizen },
  { icon: "♟", tier: "Field Execution", tone: "ngo", title: "NGO Partner", description: "Verified ground organizations leading ward sweep operations, crew mobilization, and tangible cleanup tasks.", features: ["Ward-based mission queue", "Volunteer mobilisation", "Evidence and expense logging"], label: "Enter NGO Console", href: portalUrls.ngo },
  { icon: "▤", tier: "Impact Funding", tone: "csr", title: "CSR & ESG Partner", description: "Corporate philanthropies funding zero-waste projects and tracking ESG impact.", features: ["Mission escrow funding", "Field telemetry", "Statutory ESG reporting"], label: "Access CSR Portal", href: portalUrls.csr },
  { icon: "▦", tier: "Command Tier", tone: "admin", title: "Admin", description: "Municipal command workspace for operational oversight and governance.", features: ["Ward telemetry", "Photo audit validation", "CSR fund-flow review"], label: "Open Admin Command", href: portalUrls.admin },
] as const;

export default function RoleEntryPage() {
  return <div className={styles.page}>
    <PublicSiteHeader />
    <main className={styles.main}>
      <div className={styles.utilityLine}><span className={styles.security}>● RBAC Security Level 4</span><i /> <b>NCT CIVIC OPERATING GRID</b><span>DigiLocker &amp; Parichay Ready</span><strong>Active Nodes: 272 Wards</strong></div>
      <header className={styles.heading}><span className={styles.framework}>♧ Delhi NCT Urban Sanitation Modernization Framework</span><h1>Select Your Operational Role</h1><p>Choose an accredited tier to access the appropriate workspace.</p></header>
      <div className={styles.selectorLabel}>PRIMARY PORTAL SELECTOR</div>
      <details className={styles.selector}>
        <summary><span className={styles.selectIcon}>♙</span><span><b>Select your operating credential…</b><small>Citizen · NGO · CSR Sponsor · Municipal Authority</small></span></summary>
        <div>{portals.map((portal, index) => <a href={portal.href} key={portal.title}>{index + 1} · {portal.title} Portal →</a>)}</div>
      </details>
      <section className={styles.cards}>{portals.map((portal) => <article className={styles.card} key={portal.title}>
        <div className={styles.cardTop}><span className={`${styles.cardIcon} ${styles[portal.tone]}`}>{portal.icon}</span><span className={`${styles.tier} ${styles[`tier_${portal.tone}`]}`}>{portal.tier}</span></div>
        <h2>{portal.title}</h2><p>{portal.description}</p><ul>{portal.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
        <a className={styles.continue} href={portal.href}>{portal.label}<b>→</b></a>
      </article>)}</section>
      <section className={styles.health}><header><div><small>DELHI NCT NETWORK HEALTH</small><h2>Real-Time Grid Status Across 12 Administrative Zones</h2></div><span>● Telemetry Active · Latency 240ms</span></header><div className={styles.healthStats}>{[["ACTIVE WARDS", "272 / 272", "✓ 100% On-grid"], ["24H RESOLVED SLA", "94.8%", "↗ +3.2% vs last week"], ["ACTIVE NGO CREWS", "142", "♟ 1,890 sanitarians"], ["CSR ESCROW ALLOCATED", "₹4.82 Cr", "▣ 38 Active missions"]].map(([label, value, detail]) => <article key={label}><small>{label}</small><b>{value}</b><span>{detail}</span></article>)}</div></section>
    </main>
    <PublicSiteFooter />
  </div>;
}
