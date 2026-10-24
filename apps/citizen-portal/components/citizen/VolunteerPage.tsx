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
  status: string;
  priority: string;
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
  const [selectedSlug, setSelectedSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    if (name.trim().length < 2 || !email.includes("@") || phone.trim().length < 8) {
      setSignupState({ type: "error", message: "Enter your name, valid email, and phone number to register." });
      return;
    }

    setSignupState({ type: "submitting" });

    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: selectedMission.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
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

      const refreshed = await fetch("/api/volunteers").then(r => r.json());
      if (refreshed.success) setMissions(refreshed.data);

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
        <Link href="/" className={styles.brand}><span>✳</span><b>SAAF</b><small>CIVIC CLEANLINESS</small></Link>
        <nav>
          <Link href="/">Hub Overview</Link>
          <Link href="/report">Report Issue</Link>
          <Link href="/">My Reports</Link>
          <Link href="/">Neighborhood Activity</Link>
        </nav>
        <span className={styles.hotline}>Public signup<br /><b>Contact the mission organizer</b></span>
        <span className={styles.user}>Public volunteer signup<br /><small>No authenticated volunteer account</small></span>
        <Link href="/" className={styles.profile}>V</Link>
        <details className={styles.menu}>
          <summary>☰</summary>
          <nav>
            <Link href="/">Hub Overview</Link>
            <Link href="/report">Report Issue</Link>
            <Link href="/volunteer">Volunteer Missions</Link>
          </nav>
        </details>
      </header>

      <main>
        <div className={styles.breadcrumb}>
          <Link href="/">⌂ Portal</Link>　/　Citizen Action Console　/　<b>Volunteer Missions</b>
        </div>

        <section className={styles.hero}>
          <div>
            <span className={styles.missionTag}>♧ MCD ACCREDITED COMMUNITY MISSION</span>
            <h1>Browse active volunteer missions</h1>
            <p>Choose a mission listed by an NGO and register with your contact details.<br />Confirm safety arrangements directly with the mission organizer before attending.</p>
          </div>
          <div className={styles.medical}><Icon>✚</Icon><span><small>MISSION ARRANGEMENTS</small><b>Confirm details with organizer</b></span></div>
        </section>

        <section className={styles.stats}>
          {[
            ["♙", String(missions.length), "Active missions available"],
            ["♧", String(missions.reduce((sum, mission) => sum + mission.filledSlots, 0)), "Filled mission slots"],
            ["⛨", "Public signup", "Identity is self-reported"],
            ["♙", "No login", "Volunteer accounts are not authenticated"],
          ].map(([icon, value, label]) => (
            <article key={label}><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></article>
          ))}
        </section>

        <div className={styles.content}>
          <section className={styles.missionSection}>
            <div className={styles.sectionTitle}>
              <div><h2>Local Missions Around You</h2><p>Select an active neighborhood drive to prefill task targets &amp; shift roster.</p></div>
              <span>Active missions from SAAF API</span>
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
                      mission.priority.toLowerCase() === "high" ? styles.urgent
                      : mission.priority.toLowerCase() === "low" ? styles.eco
                      : styles.scheduled
                    }>{mission.tag}</b>
                    <small>{mission.wardLabel}</small>
                    {selectedSlug === mission.slug && <span>✓ Selected</span>}
                  </div>
                  <h3>{mission.name}</h3>
                  <p>{mission.description}</p>
                  <div className={styles.missionInfo}>
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
                  <div className={styles.gear}><span>{mission.status}</span></div>
                </article>
              ))}
            </div>
            <p>No mission map is configured. Use the location shown on each mission and confirm details with its NGO.</p>
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
              <label>Full Name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></label>
              <label>Email Address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
              <label>Phone Number
                <div className={styles.phone}><input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </label>
            </div>
            <p>Contact details are self-reported and are not verified by OTP.</p>
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
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to follow safety instructions provided by the mission organizer. I understand that this public signup does not verify my identity or provide insurance, equipment, or emergency support.</span>
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
            <div className={styles.info}>Registration is recorded in the SAAF database. Save the confirmation ID; no WhatsApp/SMS notification or volunteer login is configured.</div>
          </aside>
        </div>

        <section className={styles.safety}>
          <div className={styles.sectionTitle}>
            <div><Eyebrow>PUBLIC ACCOUNTABILITY</Eyebrow><h2>Why Volunteer with SAAF?</h2></div>
            <small>⛨ Civic Safety Warranty Standard v2.0</small>
          </div>
          <div>
            {[
              ["♧", "NGO-managed missions", "Available missions belong to the NGO that created or accepted them."],
              ["⛨", "Safety arrangements", "Contact the mission organizer to confirm equipment, first aid, and site conditions before attending."],
              ["♙", "Registration record", "The API records signup details and returns a confirmation ID; no certificate service is configured."],
              ["✳", "Funding records", "This signup does not track rewards, payments, or CSR matching."],
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
