import Link from "next/link";
import { Eyebrow, Icon, PortalFooter, PortalHeader } from "./PortalShell";
import styles from "./HomePage.module.css";

const indicators = [["VALIDATION", "256-bit Geofence"], ["DISBURSEMENT", "Double-Blind Escrow"], ["RESPONSE TIER", "MCD Ward Priority"]];
const metrics = [["VERIFIED CLEANS", "1,420+", "+18.4% this week"], ["CSR CAPITAL USED", "₹48.5L", "Direct Escrow"], ["CITIZEN APPROVAL", "91.4%", "6,820 ratings"], ["AVG SLA DISPATCH", "<3.8h", "Target 4.0h standard"]];

export default function HomePage() {
  return <div className={styles.page}><PortalHeader active="Hub Overview" />
    <main>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.pill}><i /> DELHI NCT WARD OPERATING NETWORK <span>·</span> <small>Real-time SAAF Grid v2.4</small></div>
          <h1>Spot. Assess.<br /><em>Act. Follow-up.</em></h1>
          <h2>India&apos;s First Verified Urban Sanitation Operating Grid — Delhi NCT Pilot</h2>
          <p>Transforming civic sanitation complaints into verifiable, contractor and NGO-executed cleanups with cryptographic photo audits, citizen follow-up confirmation, and CSR-backed escrow funding.</p>
          <div className={styles.heroActions}><Link href="/report" className={styles.primary}>＋ Report a Sanitation Hazard</Link><Link href="#hotspots" className={styles.secondary}>◎ Explore Live Hotspots Map</Link><Link href="/entry" className={styles.textAction}>Select Role &amp; Sign In →</Link></div>
          <div className={styles.trustFacts}>{indicators.map(([k,v])=><div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
        </div>
        <aside className={styles.pulse}>
          <div className={styles.pulseHead}><b><span>▦</span> Live Pilot Telemetry</b><span className={styles.sync}>NCT Zone Sync</span></div>
          <div className={styles.metricGrid}>{metrics.map(([k,v,d])=><div className={styles.metric} key={k}><small>{k}</small><strong>{v}</strong><span>{d}</span></div>)}</div>
          <div className={styles.proof}><img src="/citizen/home-proof.png" alt="Verified sanitation cleanup evidence"/><div><b><i/> Ward 142 · Nizamuddin West</b><span>2.4T Solid Waste Lifted &amp; Neutralized</span><small>Proof Sealed　 Audit ID #ND-8891</small></div><span className={styles.proofMore}>⚙</span></div>
        </aside>
      </section>

      <section className={styles.hotspots} id="hotspots"><div className={styles.sectionTitle}><div><Eyebrow>◉ LIVE WARD INTELLIGENCE</Eyebrow><h2>Live City Hotspots</h2><p>Explore verified sanitation reports and active response zones across Delhi.</p></div><Link href="/portal">Open Ward 84 Explorer　→</Link></div>
        <div className={styles.mapPanel}><div className={styles.mapCanvas} aria-label="Illustrative Delhi ward hotspot map"><div className={styles.mapLabel}>DELHI NCT　·　LIVE REPORTS</div><div className={styles.mapRoads}/><span className={`${styles.pin} ${styles.pinOne}`}>12</span><span className={`${styles.pin} ${styles.pinTwo}`}>8</span><span className={`${styles.pin} ${styles.pinThree}`}>5</span><span className={`${styles.pin} ${styles.pinFour}`}>3</span><span className={styles.mapNorth}>N ↑</span></div><div className={styles.hotspotList}><div className={styles.listHead}><b>Active Hotspots</b><span>Updated 2 min ago</span></div>{[["Ward 84 · Kashmere Gate", "Drain blockage · Urgent", "12 reports"],["Ward 142 · Nizamuddin West","Overflowing garbage · High","8 reports"],["Ward 67 · Yamuna Ghat","Water contamination · Monitor","5 reports"]].map(([a,b,c],i)=><article className={styles.hotspotRow} key={a}><span className={`${styles.dot} ${i===0?styles.urgent:""}`}/><div><b>{a}</b><span>{b}</span></div><small>{c}</small></article>)}<Link href="/portal" className={styles.openMap}>View all ward hotspots　→</Link></div></div>
      </section>

      <section className={styles.workflow}><div className={styles.sectionTitle}><div><Eyebrow>HOW THE CIVIC LOOP WORKS</Eyebrow><h2>From report to verified action</h2><p>Every citizen report follows a transparent, accountable path.</p></div><Link href="/report">Start a report　→</Link></div><div className={styles.steps}>{[["01","SPOT","Report with a location and photo"],["02","ASSESS","Issue is checked and prioritized"],["03","ACT","A verified local team responds"],["04","FOLLOW-UP","Citizens confirm the outcome"]].map(([n,t,d],i)=><article key={n}><span className={styles.stepNumber}>{n}</span><i className={styles.stepLine}/><div className={styles.stepContent}><small>STEP {n}</small><b>{t}</b><p>{d}</p></div>{i<3&&<span className={styles.stepArrow}>→</span>}</article>)}</div></section>

      <section className={styles.citizenCard}><div className={styles.citizenVisual}><div className={styles.visualGrid}><div>WARD 84<br/><b>COMMUNITY PULSE</b></div><span>91.4%<small>Verified outcome rate</small></span><i>● ● ●</i></div><div className={styles.visualTag}>Citizen verified · 2 hours ago</div></div><div className={styles.citizenCopy}><Eyebrow>YOUR NEIGHBORHOOD. YOUR VOICE.</Eyebrow><h2>Good streets start with someone who cares.</h2><p>Flag a sanitation issue, follow its progress, and confirm the clean-up. Your reports help local teams respond where they’re needed most.</p><ul><li>Geotagged, multi-angle incident capture</li><li>Track each update from report to resolution</li><li>Confirm completed work in your community</li></ul><Link href="/entry" className={styles.primary}>Continue as Citizen　→</Link></div></section>

      <section className={styles.assurance} id="impact"><div><span>✳</span><div><Eyebrow>GUARANTEED PUBLIC INTEGRITY</Eyebrow><h2>Open Civic Data API &amp; 256-Bit Geofenced Audit Ledger</h2><p>Every timestamp, geo-coordinate, weighbridge slip, and verified citizen audit receipt is signed cryptographically and indexed on Delhi NCT’s open public sanitation ledger.</p></div></div><Link href="/portal">Explore Public SLA Ledger</Link></section>
      <section className={styles.volunteerCall}><Icon>♧</Icon><div><Eyebrow>COMMUNITY VOLUNTEER DRIVE</Eyebrow><h2>Join a neighborhood clean-up this weekend</h2><p>Verified missions, safety gear, and local teams are ready when you are.</p></div><Link href="/volunteer" className={styles.primary}>Explore Volunteer Drives　→</Link></section>
    </main><PortalFooter compact />
  </div>;
}
