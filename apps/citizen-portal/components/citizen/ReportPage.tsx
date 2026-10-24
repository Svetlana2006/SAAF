"use client";
import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth, useUser } from "@clerk/nextjs";
import { Icon, PortalFooter, PortalHeader } from "./PortalShell";
import styles from "./ReportPage.module.css";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "200px", background: "#111", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "12px" }}>
      Loading map...
    </div>
  ),
});

type ReportPhoto = { id: string; file: File; src: string };

const categories = [
  "Overflowing Garbage Dump",
  "C&D Debris (Construction)",
  "Choked Storm Drain",
  "Hazardous / Bio-Medical",
  "Open Sewage Leak",
  "Public Toilet Disrepair",
];

type SubmitState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; referenceId: string; locationArea: string; wardZone: string }
  | { type: "error"; message: string };

export default function ReportPage() {
  const { getToken } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const account = primaryEmail ? { email: primaryEmail, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || primaryEmail } : null;
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState(categories[0]);
  const [severity, setSeverity] = useState("Urgent / Obstruction");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<(ReportPhoto | null)[]>([null, null, null]);
  const [photoError, setPhotoError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" });
  const [lat, setLat] = useState(28.668);
  const [lng, setLng] = useState(77.231);
  const [address, setAddress] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  useEffect(() => {
    if (!userLoaded || !primaryEmail) return;
    void getToken().then((token) => {
      if (!token) return undefined;
      return fetch("/api/citizen/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }).catch(() => undefined);
  }, [getToken, primaryEmail, userLoaded]);

  const uploadedCount = photos.filter(Boolean).length;

  function toPhoto(file: File): ReportPhoto {
    return { id: crypto.randomUUID(), file, src: URL.createObjectURL(file) };
  }

  function pickSlotPhoto(event: ChangeEvent<HTMLInputElement>, index: number) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files can be added as issue evidence.");
      return;
    }
    const photo = toPhoto(file);
    if (photos[index]) URL.revokeObjectURL(photos[index]!.src);
    setPhotos((current) => {
      const next = [...current];
      next[index] = photo;
      return next;
    });
    setPhotoError("");
    setSubmitState({ type: "idle" });
  }

  function pickPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const valid = selected.filter((file) => file.type.startsWith("image/"));
    if (valid.length !== selected.length)
      setPhotoError("Only image files can be added as issue evidence.");
    else setPhotoError("");
    if (!valid.length) return;
    const additions = valid.map(toPhoto);
    setPhotos((current) => {
      const next = [...current];
      for (const photo of additions) {
        if (next.filter(Boolean).length >= 5) {
          URL.revokeObjectURL(photo.src);
          continue;
        }
        const openSlot = next.slice(0, 3).findIndex((item) => item === null);
        const index = openSlot === -1 ? next.length : openSlot;
        next[index] = photo;
      }
      return next;
    });
    if (photos.filter(Boolean).length + additions.length > 5) setPhotoError("A report can include up to 5 photos.");
    setSubmitState({ type: "idle" });
  }

  function removePhoto(index: number) {
    const photo = photos[index];
    if (photo) URL.revokeObjectURL(photo.src);
    setPhotos((current) => {
      if (index < 3) {
        const next = [...current];
        next[index] = null;
        return next;
      }
      return current.filter((_, photoIndex) => photoIndex !== index);
    });
    setSubmitState({ type: "idle" });
  }

  async function handleSubmit() {
    if (uploadedCount < 3) return;
    if (!locationConfirmed || address.trim().length < 3) {
      setSubmitState({ type: "error", message: "Set the map pin or search for a location, then enter a nearby address or landmark." });
      return;
    }
    setSubmitState({ type: "submitting" });

    try {
      // Build FormData for multipart upload
      const formData = new FormData();
      const validPhotos = photos.filter(Boolean) as ReportPhoto[];
      for (const p of validPhotos) formData.append("photos", p.file);
      formData.append("category", category);
      formData.append("severity", severity);
      formData.append("description", note);
      formData.append("isAnonymous", (!account || isAnonymous).toString());
      // The user must confirm or search the map location before submission.
      formData.append("latitude", lat.toString());
      formData.append("longitude", lng.toString());
      formData.append("address", address);

      const token = await getToken();
      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitState({ type: "error", message: json.error ?? "Submission failed." });
        return;
      }

      setSubmitState({
        type: "success",
        referenceId: json.data.reportId,
        locationArea: json.data.locationArea,
        wardZone: json.data.wardZone,
      });
    } catch {
      setSubmitState({
        type: "error",
        message: "Network error — please try again.",
      });
    }
  }

  const isSubmitting = submitState.type === "submitting";
  const isSuccess = submitState.type === "success";

  return (
    <div className={styles.page}>
      <PortalHeader compact active="My Reports" />
      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/">⌂ Portal</Link>
          <span>/</span>
          <Link href="/">Citizen Action Console</Link>
          <span>/</span>
          <b>Report Issue</b>
          <span className={styles.sla}>Guest reports are anonymous · signed-in reporters choose per submission</span>
        </div>
        <section className={styles.title}>
          <div>
            <span className={styles.audit}>♧ SAAF GROUND AUDIT PROTOCOL 2.4</span>
            <h1>Spot &amp; Report Civic Sanitation Issue</h1>
            <p>Submit location, issue details, and photos. The API offers new reports to registered NGO partners; submission does not guarantee a response time.</p>
          </div>
          <div className={styles.ticket}>
            <Icon>▣</Icon>
            <span>
              <small>ASSIGNED REFERENCE</small>
              <b>{isSuccess ? submitState.referenceId : "Generated after submission"}</b>
            </span>
          </div>
        </section>
        <section className={styles.stepper}>
          <div className={styles.step}><b>{uploadedCount >= 3 ? "✓" : "1"}</b><span><small>STEP 01</small><strong>Multi-Angle Capture</strong><small>{uploadedCount} of 3 angle slots filled</small></span></div>
          <i />
          <div className={`${styles.step} ${styles.current}`}><b>2</b><span><small>STEP 02</small><strong>Location</strong><small>Confirm pin or address</small></span></div>
          <i />
          <div className={styles.step}><b>3</b><span><small>STEP 03</small><strong>Issue Details</strong><small>Category &amp; Access Notes</small></span></div>
          <i />
          <div className={styles.step}><b>4</b><span><small>STEP 04</small><strong>AI Authenticity &amp; Dispatch</strong><small>Tamper Guard &amp; Confirmation</small></span></div>
        </section>
        <div className={styles.columns}>
          <div className={styles.left}>
            {/* ── Photo Evidence ─────────────────────────────── */}
            <section className={styles.panel}>
              <div className={styles.panelHeading}>
                <Icon>▣</Icon>
                <div>
                  <b>Multi-Angle Photo Evidence</b>
                  <small>Upload a photo into each angle slot. Each selected image replaces its placeholder; add extra images after filling the first three.</small>
                </div>
                <label className={styles.upload}>
                  ＋ Add photos
                  <input type="file" accept="image/*" multiple onChange={pickPhotos} aria-label="Upload three or more issue photos from different angles" />
                </label>
              </div>
              <div className={styles.angleGuidance}>
                <b>{uploadedCount} of 3 angle slots filled</b>
                <span className={uploadedCount >= 3 ? styles.ready : ""}>{uploadedCount >= 3 ? "Minimum met" : "Fill each photo slot to continue"}</span>
                <div><small>01　Context</small><small>02　Materials</small><small>03　Detail</small></div>
              </div>
              {photoError && <p className={styles.photoError} role="alert">{photoError}</p>}
              <div className={styles.evidenceGrid}>
                {Array.from({ length: Math.max(3, photos.length) }, (_, i) => {
                  const photo = photos[i];
                  const angle = ["Context", "Materials", "Detail"][i] ?? `Angle ${i + 1}`;
                  return (
                    <article className={`${styles.uploadedPhoto} ${photo ? styles.hasPhoto : styles.emptySlot}`} key={photo?.id ?? `empty-angle-${i}`}>
                      {photo ? (
                        <>
                          <div className={styles.imageWrap}>
                            <img src={photo.src} alt={`Issue evidence, angle ${i + 1}: ${photo.file.name}`} />
                            <small>ANGLE {String(i + 1).padStart(2, "0")} · {angle.toUpperCase()}</small>
                            <span>✓</span>
                            <label className={styles.replaceImage}>
                              ↻ Replace
                              <input type="file" accept="image/*" onChange={(event) => pickSlotPhoto(event, i)} aria-label={`Replace angle ${i + 1} photo`} />
                            </label>
                          </div>
                          <b title={photo.file.name}>{angle}</b>
                          <div className={styles.photoCardFooter}>
                            <small>{photo.file.name}</small>
                            <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove angle ${i + 1} photo`}>Remove</button>
                          </div>
                        </>
                      ) : (
                        <label className={styles.emptyPhoto}>
                          <span>＋</span>
                          <b>Upload photo</b>
                          <small>Angle {String(i + 1).padStart(2, "0")} · {angle} view</small>
                          <input type="file" accept="image/*" onChange={(event) => pickSlotPhoto(event, i)} aria-label={`Upload angle ${i + 1}, ${angle} view`} />
                        </label>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className={styles.aiNote}>♧ AI Multiple perspectives alleviate the automated triage engine to measure debris depth and approximate tonnage before deployment.</div>
            </section>

            {/* ── Category & Notes ───────────────────────────── */}
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <Icon>▤</Icon>
                <b>Issue Classification &amp; Severity</b>
                <small>Identify the primary sanitation violation to dispatch the appropriate municipal machinery (suction jetter, tipper, or compact compactor).</small>
              </div>
              <div className={styles.categories}>
                {categories.map((item, i) => (
                  <button type="button" key={item} onClick={() => setCategory(item)} className={`${styles.category} ${category === item ? styles.selected : ""}`}>
                    <b>{["▧", "⚒", "⌂", "△", "♧", "▣"][i]}　{item}</b>
                    <small>{["Organic bins, scattered solid municipal waste to sidewalk edge.", "Bricks, rubble, abandoned plaster & construction debris.", "Blocked drain culverts, monsoon overflow & silt stagnation.", "Medical, clinical containers, hazardous materials.", "Blackwater pipeline breach, septic backup & sewer seepage.", "Unhygienic public toilet, broken facilities & fixtures."][i]}</small>
                  </button>
                ))}
              </div>
              <div className={styles.severity}>
                <b>Severity &amp; Traffic Impact</b>
                <span>Affects pedestrian walkway &amp; road shoulder</span>
                <div>
                  {["Routine Cleanup", "Elevated Priority", "Urgent / Obstruction", "Hazardous Spill"].map((item) => (
                    <button key={item} type="button" onClick={() => setSeverity(item)} className={severity === item ? styles.severityActive : ""}>{item}</button>
                  ))}
                </div>
              </div>
              <label className={styles.noteLabel}>
                Ground Access Notes &amp; Specific Landmarks <small>{note.length}/500 characters</small>
                <textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The community bin at the junction has spilled over onto the pedestrian walkway and is blocking the stormwater gully. Mention any access constraints for the municipal tipper truck." />
              </label>
              <small className={styles.hint}>ⓘ Specify exact landmarks (underpass, metro entry) to assist municipal crews.</small>
            </section>

            {/* ── Reporter ───────────────────────────────────── */}
            <section className={styles.reporter}>
              <span>{account ? account.name.slice(0, 1).toUpperCase() : "G"}</span>
              <div>
                <b>{account ? account.name : "Guest report"} <small>{account ? account.email : "No account signed in"}</small></b>
                <small>{account ? "Your account can view its submitted reports. Email and phone stay private." : "Guest submissions are always anonymous and are not linked to a Citizen account."}</small>
                {!account && <p><Link href="/login">Sign in or create an account</Link> to share your display name with a report.</p>}
              </div>
              <label className={styles.privacyChoice}>
                <input type="checkbox" checked={!account || isAnonymous} disabled={!account} onChange={event => setIsAnonymous(event.target.checked)} />
                <span><b>Keep this report anonymous</b><small>{account ? "When unchecked, your display name appears on the public report. Contact details remain private." : "Sign in to choose whether your display name is shown."}</small></span>
              </label>
            </section>
          </div>

          <aside className={styles.right}>
            {/* ── AI Defense Engine ──────────────────────────── */}
            <section className={styles.aiCard}>
              <header>
                <Icon>✳</Icon>
                <div><b>REPORT SUBMISSION CHECKS</b><small>SERVER VALIDATED</small></div>
              </header>
              <h2>Input validation</h2>
              <p>The API validates required fields, supported image formats, and file sizes.</p>
              {[
                ["Image content type", "JPEG, PNG, or WebP signature required"],
                ["File size", "Maximum 8 MB per image"],
                ["Number of photos", "Between 3 and 5"],
                ["Location fields", "Coordinates and landmark are validated"],
              ].map(([t, d]) => (
                <div className={styles.check} key={t}><b>✓</b><span><strong>{t}</strong><small>{d}</small></span></div>
              ))}
              <div className={styles.load}><span><small>CLASSIFICATION</small><b>Selected by reporter</b></span><span><small>TRIAGE</small><b>No AI analysis configured</b></span></div>
            </section>

            {/* ── Location ───────────────────────────────────── */}
            <section className={styles.location}>
              <header><Icon>⌖</Icon><b>Location &amp; Ward</b><span>SELECT LOCATION</span></header>
              <MapPicker
                lat={lat}
                lng={lng}
                address={address}
                onMove={(newLat, newLng) => { setLat(newLat); setLng(newLng); setLocationConfirmed(true); }}
                onAddressChange={setAddress}
                apiKey={process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""}
              />
            </section>

            {/* ── Submit Card ────────────────────────────────── */}
            <section className={styles.submitCard}>
              <div className={styles.slaNote}>
                ♧ <span><b>Report privacy choice</b><small>Guest submissions stay anonymous. Signed-in citizens can choose whether to show their display name; email and phone stay private.</small></span>
              </div>
              <small className={styles.uploadRequirement}>
                {uploadedCount < 3 ? "Add at least 3 photos (up to 5)." : "Photo requirement met · " + uploadedCount + " images ready"} {locationConfirmed ? "· Location selected" : "· Confirm a location on the map"}
              </small>

              {/* Error state */}
              {submitState.type === "error" && (
                <p className={styles.photoError} role="alert" style={{ marginBottom: "0.75rem" }}>
                  ⚠ {submitState.message}
                </p>
              )}

              {/* Success state */}
              {isSuccess && (
                <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "8px", fontSize: "0.8rem" }}>
                  <b style={{ color: "#22c55e" }}>✓ Report Submitted · {submitState.referenceId}</b>
                  <br /><small>{submitState.locationArea}{submitState.wardZone ? ` · ${submitState.wardZone}` : ""}</small>
                  <br /><Link href={`/reports/${encodeURIComponent(submitState.referenceId)}`}>View public status and photos</Link>
                </div>
              )}

              <button
                type="button"
                className={styles.submit}
                disabled={uploadedCount < 3 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting
                  ? "⏳ Uploading & Submitting…"
                  : isSuccess
                  ? `✓ Submitted · #${submitState.referenceId}`
                  : "Submit Verified Report　➤"}
              </button>
              <button type="button" className={styles.draft} onClick={() => setSubmitState({ type: "idle" })}>
                ♙　Save Encrypted Draft
              </button>
              <small>★ Critical Spill or Acute danger? Hotline: <a href="tel:18002447233">1800-244-SAAF</a></small>
            </section>
          </aside>
        </div>
        <section className={styles.transparency}>
          <div>◉ <span><b>Real-Time Open Data Transparency</b><small>Once submitted, this report&apos;s pipeline timeline will be transparent to citizens via satellite &amp; geotag audits.</small></span></div>
          <b>Anonymous<small>No citizen account attached</small></b>
          <b>3–5<small>Photos required per report</small></b>
        </section>
      </main>
      <PortalFooter compact />
    </div>
  );
}
