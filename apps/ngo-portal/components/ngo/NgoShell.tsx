"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient as createSupabaseClient } from "@saaf/platform/supabase/client";
import styles from "./NgoShell.module.css";

const nav = [
  { href: "/", label: "NGO Dashboard", icon: "▦" },
  { href: "/reports", label: "Reports", icon: "▤" },
  { href: "/volunteers", label: "Volunteers", icon: "♧" },
  { href: "/funding", label: "Funding Updates", icon: "▣" },
];

export default function NgoShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ user?: { email?: string }; ngo?: { name?: string }; membership?: { role?: string } } | null>(null);
  useEffect(() => { fetch("/api/ngo/me").then(r => r.ok ? r.json() : null).then(setProfile).catch(() => setProfile(null)); }, []);
  async function signOut() { await createSupabaseClient().auth.signOut(); window.location.assign("/login"); }
  const active = nav.find(item => item.href === pathname)?.href ?? "/";
  return <div className={styles.app}>
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/"><span className={styles.brandMark}>↗</span><span><b>SAAF NGO</b><small>MUNICIPAL FIELD PORTAL</small></span></Link>
      <div className={styles.partner}><span>▣</span> {profile?.ngo?.name ?? "NGO profile unavailable"} {profile?.membership?.role ? <><i>•</i> {profile.membership.role}</> : null}</div>
      <a className={styles.helpline} href="tel:18002447233">♧ <span>Helpline<br/><b>1800-244-SAAF</b></span></a>
      <button className={styles.bell} aria-label="Notifications">♧<i/></button>
      <button className={styles.profile} onClick={signOut} title="Sign out"><span><b>{profile?.user?.email ?? "Signed-in account"}</b><small>Sign out</small></span><i>{(profile?.user?.email?.slice(0, 2) ?? "NG").toUpperCase()}</i></button>
    </header>
    <aside className={styles.sidebar}>
      <small className={styles.sideTitle}>OPERATIONAL CONSOLE</small>
      <nav>{nav.map(item=><Link key={item.href} href={item.href} className={`${styles.navItem} ${active===item.href?styles.active:""}`}><span>{item.icon}</span><b>{item.label}</b></Link>)}</nav>
      <section className={styles.credential}><small>ACTIVE MEMBERSHIP</small><b>{profile?.ngo?.name ?? "Profile unavailable"}</b><span>{profile?.user?.email ?? "Membership could not be loaded"}</span><p><span>Role</span><b>{profile?.membership?.role ?? "Unknown"}</b></p></section>
    </aside>
    <main className={styles.content}>{children}</main>
  </div>;
}
