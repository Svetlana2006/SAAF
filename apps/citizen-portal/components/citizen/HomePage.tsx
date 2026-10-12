"use client";
import Link from "next/link";
import { PublicSiteFooter, PublicSiteHeader } from "./PublicSiteShell";
import styles from "./HomePage.module.css";

const metrics=[["VERIFIED CLEANS","1,420+","↗ +18.4% this week","green"],["CSR CAPITAL USED","₹48.5L","♙ Direct Escrow","dark"],["CITIZEN APPROVAL","91.4%","♧ 6,820 ratings","green"],["AVG SLA DISPATCH","<3.8h","✓ Target 4.0h standard","blue"]] as const;
const steps=[["01","Spot & Geotag","Multi-angle evidence and verified mobile capture with location, timestamp, and category classification."],["02","Assess & Prioritize","Severity, recurrence, proximity, and material diagnostics help the right team respond."],["03","Act & Document","Accredited local teams record cleanup progress with geotagged before and after evidence."],["04","Follow-up & Audit","Citizens confirm completed work before escrow release and transparent closeout."]];
const hotspots=[["Critical Dump • DL-402","Okhla Phase 2 – Cluster Dump","Uncontrolled commercial debris spilling into pedestrian lane.","98","SLA Timer: 01h 42m","red"],["High Footfall Hazard • DL-119","Chandni Chowk G.P.O. Back Alley","Organic market accumulation near historic postal artery.","91","SLA Timer: 02h 15m","red"],["Drain Silt • DL-084","Laxmi Nagar Metro Pillar 44","Runoff stagnation and plastic clogging beneath primary pedestrian crossover.","78","SLA Timer: 03h 05m","blue"]] as const;
const roles=[["♧","Citizen Reporter & Volunteer","Submit instant geotagged sanitation hazards in your ward, monitor resolution progression in real time, and join community weekend cleanup drives.",["Sub-60s photo reporting","Earn Civic Impact Badges"],"Access Citizen Portal","/entry","citizen"],["♟","Grassroots NGO Taskforce","Receive ward-specific cleanup dispatches, orchestrate field crew rosters, verify disposal weighbridge receipts, and claim escrow grants.",["Direct ward dispatch queue","Automated weighbridge logs"],"Taskforce Console","/ngo","ngo"],["▤","CSR & Impact Sponsor","Allocate targeted sanitation grants across specific Delhi pin codes with transparent milestone escrow tracking and SEBI-compliant ESG reports.",["SEBI / RBI-aligned reporting","Tied milestone escrow lock"],"Sponsor Registry","/csr","sponsor"],["▦","Municipal Governance & Admin","City-wide command telemetry across 272 wards, recurrence diagnostics, sanitation contractor penalty audits, and dynamic route tuning.",["Contractor SLA penalty tracking","Ward health analytics engine"],"Enter Command Grid","/admin","admin"]] as const;

export default function HomePage(){return <div className={styles.page}><PublicSiteHeader/>
  <main>
    <section className={styles.hero}><div className={styles.heroCopy}><div className={styles.pill}><i/> DELHI NCT WARD OPERATING NETWORK <span>·</span><small>Real-time SAAF Grid v2.4</small></div><h1>Spot. Assess.<br/><em>Act. Follow-up.</em></h1><h2>India&apos;s First Verified Urban Sanitation Operating Grid — Delhi NCT Pilot</h2><p>Transforming civic sanitation complaints into verifiable cleanups with cryptographic photo audits, citizen follow-up confirmation, and CSR-backed escrow funding.</p><div className={styles.heroActions}><Link href="/report" className={styles.primary}>▣　Report a Sanitation Hazard</Link><Link href="#hotspots" className={styles.secondary}>◎　Explore Live Hotspots Map</Link><Link href="/entry" className={styles.roleLink}>Select Role &amp; Sign In　→</Link></div><div className={styles.trust}>{[["VALIDATION","256-bit Geofence"],["DISBURSEMENT","Double-Blind Escrow"],["RESPONSE TIER","MCD Ward Priority"]].map(item=><div key={item[0]}><small>{item[0]}</small><b>{item[1]}</b></div>)}</div></div>
      <aside className={styles.telemetry}><header><b>▦　Live Pilot Telemetry</b><Tag>● NCT Zone Sync</Tag></header><div className={styles.metricGrid}>{metrics.map(([label,value,detail,tone])=><article key={label} className={styles[`metric_${tone}`]}><small>{label}</small><b>{value}</b><span>{detail}</span></article>)}</div><div className={styles.proof}><img src="/citizen/home-proof.png" alt="Verified sanitation cleanup evidence"/><div><b><i/> Ward 142 · Nizamuddin West</b><span>2.4T Solid Waste Lifted &amp; Neutralized</span><small>Proof Sealed　 Audit ID #ND-8891</small></div><span>◉</span></div></aside>
    </section>
    <section className={styles.hotspotSection} id="hotspots"><div className={styles.sectionIntro}><div><small>◉ REAL-TIME NCT SPATIAL MATRIX</small><h2>Live Ward Hotspots &amp; SLA Radar</h2><p>Real-time severity clustering across MCD Central, East, South, and North zones.</p></div><div className={styles.mapFilters}><Tag>All Wards (18)</Tag><Tag tone="red">● Urgent Dumps (6)</Tag><Tag tone="blue">● Drain Cleans (4)</Tag><Tag>✓ Verified Cleared (8)</Tag></div></div><div className={styles.mapLayout}><div className={styles.map}><div className={styles.mapToolbar}><span>Layers:　<b>Severity Heatmap</b>　 MCD Trucks (42)　 Drain Corridors</span><span>Updated live</span></div><div className={styles.mapGrid}><div className={styles.river}/><div className={styles.roadRoad}/><span className={styles.roadLabel}>Ring Road</span><span className={styles.roadLabel2}>Mathura Road</span><span className={`${styles.mapPin} ${styles.p1}`}>●</span><span className={`${styles.mapPin} ${styles.p2}`}>!</span><span className={`${styles.mapPin} ${styles.p3}`}>●</span><span className={`${styles.mapPin} ${styles.p4}`}>!</span><span className={`${styles.mapPin} ${styles.p5}`}>●</span><span className={`${styles.mapPin} ${styles.p6}`}>!</span><span className={styles.mapText}>KASHMERE GATE</span><span className={styles.mapText2}>YAMUNA GHAT</span><span className={styles.mapText3}>CONNAUGHT PLACE</span></div><div className={styles.mapLegend}><span>🔴 Urgent Dump / Hazard</span><span>🔵 Drain Blockage / Silt</span><span>🟢 Verified Cleaned</span><b>Telemetry Ping: 84ms · Delhi NCT Engine</b></div></div><aside className={styles.incidents}><header><b>Priority Incidents</b><span>● Auto-Updating</span></header>{hotspots.map(([badge,title,description,score,sla,tone])=><article key={title}><div><Tag tone={tone}>{badge}</Tag><b>{score}<small>/100</small></b></div><h3>{title}</h3><p>{description}</p><footer><span>{sla}</span><b>{tone==="red"?"Taskforce: Dispatched":"Escrow: Reserved"}</b></footer></article>)}</aside></div></section>
    <section className={styles.workflow} id="how-it-works"><div className={styles.centerTitle}><small>PROTOCOL ARCHITECTURE</small><h2>The 4-Step Closed-Loop Civic Sanitation Engine</h2><p>A deterministic accountability cycle that eliminates fake resolution receipts and ensures direct escrow compensation<br className={styles.desktopBreak}/> only after independent community validation.</p></div><div className={styles.steps}>{steps.map(([number,title,description],i)=><article key={number}><div className={styles.stepTop}><b>{number}</b><span>{["◎","▣","♧","₹"][i]}</span></div><h3>{title}</h3><p>{description}</p><small>{["◉ EXIF + Delhi Geofence Lock","▣ Dynamic Priority SLA Matrix","▧ Weighbridge Verified Haul","♙ Cryptographic Escrow Payout"][i]}</small></article>)}</div></section>
    <section className={styles.caseStudy}><div className={styles.caseTitle}><Tag>◉ Cryptographic Audit Case Study</Tag><h2>Lajpat Nagar Ring Road Flyover Abutment (Ward 157)</h2><span>Lat: 28.5684° N　·　Lng: 77.2433° E　·　<strong>SLA Met: 2h 45m</strong></span></div><div className={styles.comparison}><figure><img src="/citizen/report-debris.png" alt="Before sanitation cleanup"/><figcaption><Tag tone="red">BEFORE · 14 Oct, 08:32 IST</Tag><span>Citizen Report #DL-9082 · 3.2 Metric Tons Solid Refuse</span></figcaption></figure><figure><img src="/citizen/mission-kashmere.png" alt="After sanitation cleanup"/><figcaption><Tag>AFTER · 14 Oct, 11:17 IST</Tag><span>Executed by Safai Sathi Guild · Approved by 14 Ward Residents</span></figcaption></figure></div></section>
    <section className={styles.roles} id="roles"><div className={styles.sectionIntro}><div><small>MODULAR PARTICIPATION</small><h2>Dedicated Role Portals</h2><p>Tailored consoles designed for field operators, civic monitors, corporate sponsors, and civic executives.</p></div><span>Delhi NCT Sandbox Clearance Tier 1</span></div><div className={styles.roleGrid}>{roles.map(([icon,title,description,features,cta,href,type])=><article key={title} className={styles.roleCard}><div className={styles.roleCardHead}><span className={styles[`roleIcon_${type}`]}>{icon}</span><Tag>{type==="ngo"?"Field Execution":type==="sponsor"?"Impact Funding":type==="admin"?"Command Tier":"Public Tier"}</Tag></div><h3>{title}</h3><p>{description}</p><ul>{features.map(f=><li key={f}>✓　{f}</li>)}</ul><Link href={href}>{cta}<b>→</b></Link></article>)}</div></section>
    <section className={styles.integrity} id="impact"><div><small>◇ GUARANTEED PUBLIC INTEGRITY</small><h2>Open Civic Data API &amp; 256-Bit Geofenced Audit Ledger</h2><p>Every timestamp, geo-coordinate, weighbridge slip, and verified citizen audit receipt is signed cryptographically and indexed on Delhi NCT’s open public sanitation ledger.</p></div><div><Link href="/portal">Explore Public SLA Ledger</Link><Link href="/entry">Download Pilot Whitepaper</Link></div></section>
    <section className={styles.hotline}><span>◉</span><div><small>RAPID BIO-HAZARD LINE</small><h3>Emergency Sanitation Hotline: 1800-SAN-DELHI</h3><p>24/7 MCD bio-hazard &amp; medical refusal rapid dispatch containment team.</p></div><Link href="/volunteer" className={styles.join}>Join Corps →</Link></section>
  </main><PublicSiteFooter/></div>;
import dynamic from "next/dynamic";
import { Eyebrow, Icon, PortalFooter, PortalHeader } from "./PortalShell";
import styles from "./HomePage.module.css";

const HotspotMap = dynamic(() => import("./HotspotMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "420px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "13px" }}>
      Loading live map…
    </div>
  ),
});

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

      <section className={styles.hotspots} id="hotspots">
        <div className={styles.sectionTitle}>
          <div>
            <Eyebrow>◉ LIVE WARD INTELLIGENCE</Eyebrow>
            <h2>Live City Hotspots</h2>
            <p>Explore verified sanitation reports and active response zones across Delhi.</p>
          </div>
          <Link href="/portal">Open Ward 84 Explorer　→</Link>
        </div>
        {/* ── Real interactive MapLibre map ── */}
        <HotspotMap apiKey={process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""} />
      </section>

      <section className={styles.workflow}><div className={styles.sectionTitle}><div><Eyebrow>HOW THE CIVIC LOOP WORKS</Eyebrow><h2>From report to verified action</h2><p>Every citizen report follows a transparent, accountable path.</p></div><Link href="/report">Start a report　→</Link></div><div className={styles.steps}>{[["01","SPOT","Report with a location and photo"],["02","ASSESS","Issue is checked and prioritized"],["03","ACT","A verified local team responds"],["04","FOLLOW-UP","Citizens confirm the outcome"]].map(([n,t,d],i)=><article key={n}><span className={styles.stepNumber}>{n}</span><i className={styles.stepLine}/><div className={styles.stepContent}><small>STEP {n}</small><b>{t}</b><p>{d}</p></div>{i<3&&<span className={styles.stepArrow}>→</span>}</article>)}</div></section>

      <section className={styles.citizenCard}><div className={styles.citizenVisual}><div className={styles.visualGrid}><div>WARD 84<br/><b>COMMUNITY PULSE</b></div><span>91.4%<small>Verified outcome rate</small></span><i>● ● ●</i></div><div className={styles.visualTag}>Citizen verified · 2 hours ago</div></div><div className={styles.citizenCopy}><Eyebrow>YOUR NEIGHBORHOOD. YOUR VOICE.</Eyebrow><h2>Good streets start with someone who cares.</h2><p>Flag a sanitation issue, follow its progress, and confirm the clean-up. Your reports help local teams respond where they&apos;re needed most.</p><ul><li>Geotagged, multi-angle incident capture</li><li>Track each update from report to resolution</li><li>Confirm completed work in your community</li></ul><Link href="/entry" className={styles.primary}>Continue as Citizen　→</Link></div></section>

      <section className={styles.assurance} id="impact"><div><span>✳</span><div><Eyebrow>GUARANTEED PUBLIC INTEGRITY</Eyebrow><h2>Open Civic Data API &amp; 256-Bit Geofenced Audit Ledger</h2><p>Every timestamp, geo-coordinate, weighbridge slip, and verified citizen audit receipt is signed cryptographically and indexed on Delhi NCT&apos;s open public sanitation ledger.</p></div></div><Link href="/portal">Explore Public SLA Ledger</Link></section>
      <section className={styles.volunteerCall}><Icon>♧</Icon><div><Eyebrow>COMMUNITY VOLUNTEER DRIVE</Eyebrow><h2>Join a neighborhood clean-up this weekend</h2><p>Verified missions, safety gear, and local teams are ready when you are.</p></div><Link href="/volunteer" className={styles.primary}>Explore Volunteer Drives　→</Link></section>
    </main><PortalFooter compact />
  </div>;
}

function Tag({children,tone="green"}:{children:React.ReactNode;tone?:"green"|"red"|"blue"}){return <span className={`${styles.tag} ${styles[`tag_${tone}`]}`}>{children}</span>}
