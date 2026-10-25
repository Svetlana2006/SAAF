"use client";

import { useEffect, useState } from "react";

type Announcement = { announcementId: string; title: string; message: string; audience: string; publishedAt: string | null };

export default function AnnouncementFeed({ audience, token }: { audience: "citizen" | "ngo" | "csr"; token?: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (audience === "citizen" && !token) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch(`/api/announcements?audience=${audience}`, { cache: "no-store", headers })
      .then(async response => {
        const result = await response.json().catch(() => ({}));
        if ((response.status === 401 || response.status === 403) && active) { setAnnouncements([]); setError(""); return; }
        if (!response.ok) throw new Error(result.error ?? "Announcements are unavailable.");
        if (active) { setAnnouncements(result.announcements ?? []); setError(""); }
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Announcements are unavailable."); });
    return () => { active = false; };
  }, [audience, token]);
  if (error) return <aside role="status" style={{ margin: "12px 0", padding: 12, border: "1px solid #edc8c8", borderRadius: 8, background: "#fff7f7", color: "#7b2828" }}>{error}</aside>;
  if (!announcements.length) return null;
  return <section aria-label="SAAF announcements" style={{ display: "grid", gap: 8, margin: "12px 0" }}>
    {announcements.map(item => <article key={item.announcementId} style={{ padding: 12, border: "1px solid #cee4d4", borderLeft: "4px solid #27804a", borderRadius: 8, background: "#f4fbf6" }}>
      <strong>{item.title}</strong><p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{item.message}</p>
    </article>)}
  </section>;
}
