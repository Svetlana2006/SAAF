"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NgoShell.module.css";

const nav = [
  { href: "/ngo", label: "NGO Dashboard", icon: "▦" },
  { href: "/ngo/reports", label: "Reports", icon: "▤", badge: "14" },
  { href: "/ngo/volunteers", label: "Volunteers", icon: "♧", badge: "48" },
  { href: "/ngo/funding", label: "Funding Updates", icon: "▣", badge: "CSR Escrow" },
];

export default function NgoShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const active = nav.find(item => item.href === pathname)?.href ?? "/ngo";
  return <div className={styles.app}>
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/ngo"><span className={styles.brandMark}>↗</span><span><b>SAAF NGO</b><small>MUNICIPAL FIELD PORTAL</small></span></Link>
      <div className={styles.partner}><span>▣</span> Tier-1 Accredited Municipal Partner <i>•</i> Wards 54, 84, 108</div>
      <a className={styles.helpline} href="tel:18002447233">♧ <span>Helpline<br/><b>1800-244-SAAF</b></span></a>
      <button className={styles.bell} aria-label="Notifications">♧<i/></button>
      <div className={styles.profile}><span><b>Rajesh Paswan</b><small>Lead NGO Coordinator</small></span><i>RP</i></div>
    </header>
    <aside className={styles.sidebar}>
      <small className={styles.sideTitle}>OPERATIONAL CONSOLE</small>
      <nav>{nav.map(item=><Link key={item.href} href={item.href} className={`${styles.navItem} ${active===item.href?styles.active:""}`}><span>{item.icon}</span><b>{item.label}</b>{item.badge&&<small>{item.badge}</small>}</Link>)}</nav>
      <section className={styles.credential}><small>ACCREDITED BODY</small><b>CleanCity Alliance / Safai Sathi Guild</b><span>Reg #CCA-BUILD-884920</span><p><span>Node 24/7 SLA</span><b>● 99.8% OK</b></p></section>
    </aside>
    <main className={styles.content}>{children}</main>
  </div>;
}
