"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eyebrow, Icon, PortalFooter } from "./PortalShell";
import styles from "./VolunteerPage.module.css";

// ── Types ────────────────────────────────────────────────────────────────────
interface Mission {
  id: string;
  slug: string;
  tag: string;
  wardLabel: string;
  name: string;
  description: string;
  scheduledAt: string;
  endsAt: string;
  venue: string;
  leadNgo: string;
  totalSlots: number;
  filledSlots: number;
  spotsLeft: number;
  gearList: string[];
}

type SignupState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; message: string; signupId: string }
  | { type: "error"; message: string };

const ROLE_OPTIONS = [
  { label: "Waste Segregation & Plastic Triage", detail: "Sorting recyclables & facilitating triage" },
  { label: "Drain Desilting & Ground Support", detail: "Assisting mechanized & manual clearance crews" },
  { label: "Community Marshalling & Safety Cordons", detail: "Guiding pedestrians & maintaining heavy machinery zones" },
  { label: "Photo Telemetry & Verification Audit", detail: "Progress logging & evidence upload" },
  { label: "PPE Logistics & Hydration Station", detail: "Managing gloves, drinking water, and first aid" },
];

const SHIFT_OPTIONS = [
  { label: "Morning Shift", detail: "07:00 AM – 10:30 AM (Morning focus)" },
  { label: "Evening Shift", detail: "04:30 PM – 07:00 PM (Adult focus)" },
  { label: "Weekend Blitz", detail: "Saturday & Sunday Rollout" },
  { label: "Rapid Standby", detail: "On-call for emergency notices" },
];

function formatSchedule(scheduledAt: string, endsAt: string) {
  const start = new Date(scheduledAt);
  const end = new Date(endsAt);
  return `${start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function VolunteerPage() {
  // ── Missions data ──────────────────────────────────────────────────────────
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionsError, setMissionsError] = useState("");

  useEffect(() => {
    fetch("/api/volunteers")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setMissions(json.data);
        else setMissionsError("Failed to load missions.");
      })
      .catch(() => setMissionsError("Network error loading missions."))
      .finally(() => setMissionsLoading(false));
  }, []);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedSlug, setSelectedSlug] = useState("yamuna");
  const [time, setTime] = useState("Morning Shift");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Waste Segregation & Plastic Triage",
    "Community Marshalling & Safety Cordons",
  ]);
  const [consent, setConsent] = useState(false);
  const [signupState, setSignupState] = useState<SignupState>({ type: "idle" });

  const selectedMission = missions.find((m) => m.slug === selectedSlug) ?? missions[0];

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSignup() {
    if (!selectedMission) return;
    if (!consent) {
      setSignupState({ type: "error", message: "You must accept the safety protocols to register." });
      return;
    }
    if (selectedRoles.length === 0) {
      setSignupState({ type: "error", message: "Please select at least one role." });
      return;
    }

    setSignupState({ type: "submitting" });

    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: selectedMission.id,
          name: "Aarav Sharma",
          email: "aarav.sharma@civicmail.in",
          phone: "+919811240912",
          skills: selectedRoles,
          preferredShift: time,
          consentGiven: consent,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setSignupState({ type: "error", message: json.error ?? "Registration failed." });
        return;
      }

      // Update local mission slots
      setMissions((prev) =>
        prev.map((m) =>
          m.id === selectedMission.id
            ? { ...m, filledSlots: m.filledSlots + 1, spotsLeft: Math.max(0, m.spotsLeft - 1) }
            : m
        )
      );

      setSignupState({
        type: "success",
        signupId: json.data.signupId,
        message: json.data.message,
      });
    } catch {
      setSignupState({ type: "error", message: "Network error — please try again." });
    }
  }

  const isSubmitting = signupState.type === "submitting";
  const isSuccess = signupState.type === "success";

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/portal" className={styles.brand}><span>✳</span><b>SAAF</b><small>CIVIC CLEANLINESS</small></Link>
        <nav>
          <Link href="/portal">Hub Overview</Link>
          <Link href="/report">Report Issue</Link>
          <Link href="/portal">My Reports</Link>
          <Link href="/">Neighborhood Activity</Link>
        </nav>
        <a href="tel:18002447233" className={styles.hotline}>☎ EMERGENCY HOTLINE<br /><b>1800-244-SAAF</b></a>
        <span className={styles.user}>Aarav Sharma<br /><small>Ward 84 · Civil Lines</small></span>
        <Link href="/portal" className={styles.profile}>A</Link>
        <details className={styles.menu}>
          <summary>☰</summary>
          <nav>
            <Link href="/portal">Hub Overview</Link>
            <Link href="/report">Report Issue</Link>
            <Link href="/volunteer">Volunteer Missions</Link>
          </nav>
        </details>
      </header>

      <main>
        <div className={styles.breadcrumb}>
          <Link href="/portal">⌂ Portal</Link>　/　Citizen Action Console　/　<b>Volunteer Missions</b>
        </div>

        <section className={styles.hero}>
          <div>
            <span className={styles.missionTag}>♧ MCD ACCREDITED COMMUNITY MISSION</span>
            <h1>Join Verified Civic Action Taskforces in Ward 84</h1>
            <p>Lend a hand in neighborhood desilting, segregation, and cleanups led by accredited municipal NGOs.<br />Earn recognized civic credits, verifiable attendance records, and complete safety equipment.</p>
          </div>
          <div className={styles.medical}><Icon>✚</Icon><span><small>MEDICAL &amp; SLA BACKUP</small><b>On-Site Paramedic Unit</b></span></div>
        </section>

        <section className={styles.stats}>
          {[
            ["♙", String(missions.length || 3), "Ward 84 Missions (Within 3km)"],
            ["♧", "342", "Volunteers Mobilized this Month"],
            ["⛨", "100% Free", "Safety PPE & N95 Masks Supplied"],
            ["♙", "MCD Certified", "Digital Karma Credit Protocol"],
          ].map(([icon, value, label]) => (
            <article key={label}><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></article>
          ))}
        </section>

        <div className={styles.content}>
          <section className={styles.missionSection}>
            <div className={styles.sectionTitle}>
              <div><h2>Local Missions Around You</h2><p>Select an active neighborhood drive to prefill task targets &amp; shift roster.</p></div>
              <button type="button" className={styles.filter}>◌ Live Geospatial Filter</button>
            </div>

            {missionsError && <p style={{ color: "#f87171", padding: "1rem" }}>⚠ {missionsError}</p>}
            {missionsLoading && <p style={{ padding: "1rem", opacity: 0.6 }}>Loading missions…</p>}

            <div className={styles.missions}>
              {missions.map((mission) => (
                <article
                  className={`${styles.mission} ${selectedSlug === mission.slug ? styles.chosen : ""}`}
                  key={mission.id}
                  onClick={() => setSelectedSlug(mission.slug)}
                >
                  <div className={styles.missionHeading}>
                    <b className={
                      mission.slug === "yamuna" ? styles.urgent
                      : mission.slug === "mori" ? styles.eco
                      : styles.scheduled
                    }>{mission.tag}</b>
                    <small>{mission.wardLabel}</small>
                    {selectedSlug === mission.slug && <span>✓ Selected</span>}
                  </div>
                  <h3>{mission.name}</h3>
                  <p>{mission.description}</p>
                  <div className={styles.missionInfo}>
                    <img src={`/citizen/mission-${mission.slug}.png`} alt="" />
                    <div>
                      <span>◷　{formatSchedule(mission.scheduledAt, mission.endsAt)}</span>
                      <span>♧　{mission.venue}</span>
                      <small>{mission.filledSlots} of {mission.totalSlots} Volunteers Filled</small>
                      <div className={styles.progress}>
                        <i style={{ width: `${Math.round((mission.filledSlots / mission.totalSlots) * 100)}%` }} />
                      </div>
                    </div>
                    <b>{mission.spotsLeft} Spots Remaining</b>
                  </div>
                  <div className={styles.gear}>{mission.gearList.map((item) => <span key={item}>{item}</span>)}</div>
                </article>
              ))}
            </div>
            <button className={styles.mapButton}>⌖　 Explore Interactive Ward 84 Taskforce Map <span>⇱ Open GIS Map</span></button>
          </section>

          {/* ── Signup Form ─────────────────────────────────────────────────── */}
          <aside className={styles.form}>
            <div className={styles.formTitle}>
              <Icon>♙</Icon>
              <div><Eyebrow>CIVIC ENROLMENT</Eyebrow><h2>Volunteer Sign-up Form</h2></div>
              <small>Single-Step Enrollment</small>
            </div>
            <div className={styles.missionSelected}>
              ▣　MISSION TARGET<small>{selectedMission?.name ?? "Select a mission"}</small>
            </div>
            <div className={styles.fields}>
              <label>Full Name<input defaultValue="Aarav Sharma" /></label>
              <label>Date of Birth<input type="date" defaultValue="1998-08-14" /></label>
              <label>Email Address<input type="email" defaultValue="aarav.sharma@civicmail.in" /></label>
              <label>Phone Number
                <div className={styles.phone}>+91 <input defaultValue="98112-40912" /><b>✓ DigiLocker Verified</b></div>
              </label>
            </div>
            <div className={styles.otp}>▣　OTP Active</div>
            <fieldset>
              <legend>What kind of work would you like to do?</legend>
              <small>Select roles you are comfortable supporting:</small>
              <div className={styles.roles}>
                {ROLE_OPTIONS.map((role) => (
                  <label key={role.label}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.label)}
                      onChange={() => toggleRole(role.label)}
                    />
                    <span><b>{role.label}</b><small>{role.detail}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Select Preferred Shift Window</legend>
              <div className={styles.shifts}>
                {SHIFT_OPTIONS.map((item) => (
                  <label key={item.label}>
                    <input type="radio" name="shift" checked={time === item.label} onChange={() => setTime(item.label)} />
                    <span><b>{item.label}</b><small>{item.detail}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={styles.emergency}>
              Emergency Contact &amp; Health Note (Optional)
              <input placeholder="e.g. Asthmatic (outdoor dust sensitive) / Contact: 98110-XXXXX" />
            </label>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to adhere to MCD sanitation safety protocols, strictly wear high-visibility PPE &amp; nitrile gloves provided on-site, and follow instructions from the designated NGO Mission Commander.</span>
            </label>

            {/* Error */}
            {signupState.type === "error" && (
              <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "0.5rem" }}>⚠ {signupState.message}</p>
            )}

            {/* Success */}
            {isSuccess && (
              <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "8px", fontSize: "0.8rem" }}>
                <b style={{ color: "#22c55e" }}>✓ Registration Confirmed</b>
                <br /><small>{signupState.message}</small>
              </div>
            )}

            <button
              className={styles.submit}
              disabled={isSubmitting || !selectedMission}
              onClick={handleSignup}
            >
              {isSubmitting ? "⏳ Registering…" : isSuccess ? "✓ Registration Confirmed" : "Confirm Volunteer Registration　♙"}
            </button>
            <button className={styles.back} onClick={() => setSignupState({ type: "idle" })}>
              ↶　Join General Ward 84 Volunteer Pool
            </button>
            <div className={styles.info}>▣　You will instantly receive an automated WhatsApp confirmation with reporting coordinates, WhatsApp group link, and digital credentials to redeem your sanitized safety kit.</div>
          </aside>
        </div>

        <section className={styles.safety}>
          <div className={styles.sectionTitle}>
            <div><Eyebrow>PUBLIC ACCOUNTABILITY</Eyebrow><h2>Why Volunteer with SAAF?</h2></div>
            <small>⛨ Civic Safety Warranty Standard v2.0</small>
          </div>
          <div>
            {[
              ["♧", "Accredited NGOs Only", "Every clean-up taskforce lead is pre-vetted and audited by the Municipal Corporation of Delhi (MCD)."],
              ["⛨", "Insurance & First Aid", "Active civic volunteers are covered by standard municipal incident coverage and immediate on-ground medical backup."],
              ["♙", "Digital Karma & Credits", "Receive verifiable blockchain-hashed digital volunteer certificates eligible for college civic credits and corporate CSR awards."],
              ["✳", "CSR Matched Impact", "Every kilo of plastic segregated unlocks matching municipal CSR funding for advanced mechanization."],
            ].map(([icon, title, desc]) => (
              <article key={title as string}><Icon>{icon}</Icon><b>{title}</b><p>{desc}</p></article>
            ))}
          </div>
        </section>
      </main>
      <PortalFooter compact />
    </div>
  );
}
