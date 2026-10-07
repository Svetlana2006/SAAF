"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./InstitutionShell.module.css";

export type InstitutionNav={href:string;label:string;icon:string;badge?:string};
export default function InstitutionShell({children,portal,brand,descriptor,status,user,nav,credential}:{children:React.ReactNode;portal:"csr"|"admin";brand:string;descriptor:string;status:string;user:string;nav:InstitutionNav[];credential:{title:string;lines:string[]}}){
 const pathname=usePathname();
 return <div className={`${styles.app} ${portal==="admin"?styles.admin:""}`}><header className={styles.topbar}><Link href={portal==="csr"?"/csr":"/admin"} className={styles.brand}><span className={styles.mark}>{portal==="csr"?"▣":"✳"}</span><span><b>{brand}</b><small>{descriptor}</small></span></Link><div className={styles.topStatus}><span>●</span>{status}</div><div className={styles.topRight}><span className={styles.connected}>♧　{portal==="csr"?"Escrow Node Connected":"Live Dispatch Sync: Active"}</span><button aria-label="Notifications">♧<i/></button><div className={styles.user}><span><b>{user}</b><small>{portal==="csr"?"Head of Corporate Sustainability & CSR":"MCD Superintendent / Admin"}</small></span><i>{user.split(" ").map(x=>x[0]).join("").slice(0,2)}</i></div></div></header><aside className={styles.sidebar}><small className={styles.navLabel}>{portal==="csr"?"CSR MANAGEMENT":"CIVIC MANAGEMENT"}</small><nav>{nav.map(item=><Link href={item.href} key={item.href} className={`${styles.navItem} ${pathname===item.href?styles.active:""}`}><span>{item.icon}</span><b>{item.label}</b>{item.badge&&<small>{item.badge}</small>}</Link>)}</nav><section className={styles.credential}><b>{credential.title}</b>{credential.lines.map(line=><span key={line}>{line}</span>)}</section></aside><main className={styles.content}>{children}</main></div>
}
