import Image from "next/image";
import Link from "next/link";
import { portalUrls } from "@saaf/platform/urls";
import styles from "./PublicSiteShell.module.css";

const welcomeLinks = [
  ["Live Hotspots", "/welcome#hotspots"],
  ["How It Works", "/welcome#how-it-works"],
  ["Role Portals", "/welcome#roles"],
  ["Impact Ledger", "/welcome#impact"],
] as const;

export function PublicSiteHeader() {
  return <>
    <div className={styles.official}><span><i /> OFFICIAL PILOT · Delhi NCT Urban Sanitation Modernization &amp; Accountability Framework</span><span>Emergency Dispatch: 1800-SAN-DELHI</span></div>
    <header className={styles.header}>
      <Link href="/welcome" className={styles.brand}><Image src="/citizen/saaf-logo.png" alt="SAAF" width={34} height={34} /><span><b>SAAF</b><small>DELHI<br />NCT</small></span></Link>
      <nav className={styles.nav}>{welcomeLinks.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</nav>
      <div className={styles.actions}><Link href="/" className={styles.login}>Login / Register</Link><a href={`${portalUrls.citizen}/report`} className={styles.report}>⚑ Report Issue</a></div>
    </header>
  </>;
}

export function PublicSiteFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footerGrid}>
      <div><Link href="/welcome" className={styles.footerBrand}><Image src="/citizen/saaf-logo.png" alt="" width={30} height={30} /><b>SAAF</b></Link><p>Decentralized public sanitation verification and ward-level accountability across Delhi.</p></div>
      <div><b>Public Portal</b><a href={portalUrls.citizen}>Citizen dashboard</a><a href={`${portalUrls.citizen}/report`}>Report an issue</a><a href={`${portalUrls.citizen}/volunteer`}>Volunteer corps</a></div>
      <div><b>Institutional portals</b><a href={portalUrls.ngo}>NGO operations</a><a href={portalUrls.csr}>CSR funding</a><a href={portalUrls.admin}>Municipal administration</a></div>
    </div>
    <div className={styles.legal}><span>© 2025 SAAF Civic Foundation</span><span>Privacy Policy · Open Data API · System Status</span></div>
  </footer>;
}
