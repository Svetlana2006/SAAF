import Link from "next/link";
import Image from "next/image";
import styles from "./PortalShell.module.css";

const links = [
  ["Hub Overview", "/portal"],
  ["My Reports", "/report"],
  ["Neighborhood Activity", "/#activity"],
  ["Volunteer Drives", "/volunteer"],
  ["Civic Impact", "/#impact"],
] as const;

export function PortalHeader({ active = "Hub Overview", compact = false }: { active?: string; compact?: boolean }) {
  return (
    <>
      <div className={styles.utility}>
        <span><i /> Municipal Sanitation Authority · Official Citizen Access Portal</span>
        <span className={styles.utilityRight}><b>☎</b> Emergency Civic Hotline: <strong>1800-244-SAAF</strong><span className={styles.language}>ENG | हिन्दी</span></span>
      </div>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="SAAF Citizen Hub home">
          <span className={styles.brandIcon}><Image src="/citizen/saaf-logo.png" alt="" width={23} height={23} /></span><span><b>SAAF</b><small>{compact ? "CIVIC CLEANLINESS" : "CITIZEN HUB"}</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Citizen portal navigation">
          {links.map(([label, href]) => <Link key={label} href={href} className={active === label ? styles.active : ""}>{label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <Link href="/entry" className={styles.login}>Login / Register</Link>
          <Link href="/report" className={styles.reportButton}><span>▣</span> Report Issue</Link>
          <Link href="/entry" className={styles.profile} aria-label="Citizen account">A</Link>
        </div>
        <details className={styles.mobileNav}><summary aria-label="Open navigation">☰</summary><nav>{links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}<Link href="/report">Report an Issue</Link><Link href="/volunteer">Volunteer Drives</Link></nav></details>
      </header>
    </>
  );
}

export function PortalFooter({ compact = false }: { compact?: boolean }) {
  return <footer className={styles.footer}>
    {!compact && <div className={styles.help}><span>◉</span><b>Need immediate on-ground assistance with toxic or heavy industrial dumping?</b><a href="tel:18002447233">☎ 1800-244-SAAF (Toll Free)</a><span>·</span><a href="#whatsapp">Chat on WhatsApp</a></div>}
    <div className={styles.footerGrid}>
      <div className={styles.footerBrand}><b>SAAF</b> <small>Citizen Hub</small><p>Empowering community participation, hyper-local sanitation reporting, and transparent civic governance across city wards.</p></div>
      <div><b>Direct Citizen Actions</b><Link href="/report">Report Waste or Hazard</Link><Link href="/volunteer">Join Neighborhood Cleanup</Link><Link href="/portal">Track Grievance Ticket</Link><Link href="/">Protect Ward Sanitation</Link></div>
      <div><b>Civic Transparency</b><Link href="/#activity">Ward 84 Operational SLA</Link><Link href="/#activity">Daily Collection Roster</Link><Link href="/#impact">Sanitation Inspector Directory</Link><Link href="/#impact">Open Civic Data API</Link></div>
      <div><b>Emergency Support</b><span>Toll-Free Command Room: 1800-244-SAAF</span><span>WhatsApp Grievance Bot: +91 94000-CLEAN</span><span>HQ Municipal Central Complex, Sector 4</span></div>
    </div>
    <div className={styles.legal}><span>© 2025 SAAF Municipal Sanitation Initiative · Department of Urban Civic Systems.</span><span>Privacy Charter　 Citizen Service Guarantee　 Accessibility</span></div>
  </footer>;
}

export function Icon({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "red" }) {
  return <span aria-hidden="true" className={`${styles.icon} ${styles[tone]}`}>{children}</span>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) { return <div className={styles.eyebrow}>{children}</div>; }
