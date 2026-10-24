import Link from "next/link";
import Image from "next/image";
import styles from "./PortalShell.module.css";

const links = [
  ["Hub Overview", "/"],
  ["Report Issue", "/report"],
  ["Neighborhood Activity", "/#activity"],
  ["Volunteer Drives", "/volunteer"],
  ["Civic Impact", "/#impact"],
  ["Account", "/login"],
] as const;

export function PortalHeader({ active = "Hub Overview", compact = false }: { active?: string; compact?: boolean }) {
  return (
    <>
      <div className={styles.utility}>
        <span><i /> SAAF community portal · community reporting</span>
        <span className={styles.utilityRight}><span className={styles.language}>ENG | हिन्दी</span></span>
      </div>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="SAAF Citizen Hub home">
          <span className={styles.brandIcon}><Image src="/citizen/saaf-logo.png" alt="" width={23} height={23} /></span><span><b>SAAF</b><small>{compact ? "CIVIC CLEANLINESS" : "CITIZEN HUB"}</small></span>
        </Link>
        <nav className={styles.nav} aria-label="Citizen portal navigation">
          {links.map(([label, href]) => <Link key={label} href={href} className={active === label ? styles.active : ""}>{label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.login}>Sign in / account</Link>
          <Link href="/report" className={styles.reportButton}><span>▣</span> Report Issue</Link>
        </div>
        <details className={styles.mobileNav}><summary aria-label="Open navigation">☰</summary><nav>{links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}<Link href="/report">Report an Issue</Link><Link href="/volunteer">Volunteer Drives</Link></nav></details>
      </header>
    </>
  );
}

export function PortalFooter({ compact = false }: { compact?: boolean }) {
  return <footer className={styles.footer}>
    {!compact && <div className={styles.help}><span>◉</span><b>For urgent hazards, contact your local municipal emergency service.</b></div>}
    <div className={styles.footerGrid}>
      <div className={styles.footerBrand}><b>SAAF</b> <small>Citizen Hub</small><p>Empowering community participation, hyper-local sanitation reporting, and transparent civic governance across city wards.</p></div>
      <div><b>Citizen Actions</b><Link href="/report">Submit an anonymous report</Link><Link href="/volunteer">Browse volunteer missions</Link><Link href="/">View public report activity</Link></div>
      <div><b>Platform information</b><Link href="/#activity">Public report feed</Link><Link href="/volunteer">Mission availability</Link></div>
      <div><b>Safety</b><span>Confirm mission conditions and equipment directly with the organizer.</span></div>
    </div>
    <div className={styles.legal}><span>© 2025 SAAF Municipal Sanitation Initiative · Department of Urban Civic Systems.</span><span>Privacy Charter　 Citizen Service Guarantee　 Accessibility</span></div>
  </footer>;
}

export function Icon({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "red" }) {
  return <span aria-hidden="true" className={`${styles.icon} ${styles[tone]}`}>{children}</span>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) { return <div className={styles.eyebrow}>{children}</div>; }
