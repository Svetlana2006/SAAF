"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./ReportAreaMap.module.css";

const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const maplibreWithWorkerConfig = maplibregl as typeof maplibregl & { config: { WORKER_URL: string } };
maplibreWithWorkerConfig.config.WORKER_URL = "/maplibre-worker.mjs";

type Report = {
  reportId: string;
  status: string;
  location?: {
    nameArea: string;
    wardZone: string;
    latitude: number;
    longitude: number;
  } | null;
};

type Area = {
  key: string;
  name: string;
  wardZone: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  openCount: number;
};

export default function ReportAreaMap({ reports }: { reports: Report[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const mapLoadedRef = useRef(false);
  const [tileError, setTileError] = useState("");
  const mapError = apiKey
    ? tileError
    : "Map tiles are unavailable because NEXT_PUBLIC_MAPTILER_KEY is not configured.";

  const areas = useMemo(() => {
    const grouped = new Map<string, Area>();
    for (const report of reports) {
      const location = report.location;
      if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) continue;
      const key = `${location.latitude},${location.longitude}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.reportCount += 1;
        if (report.status === "open") existing.openCount += 1;
      } else {
        grouped.set(key, {
          key,
          name: location.nameArea,
          wardZone: location.wardZone,
          latitude: location.latitude,
          longitude: location.longitude,
          reportCount: 1,
          openCount: report.status === "open" ? 1 : 0,
        });
      }
    }
    return [...grouped.values()];
  }, [reports]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!apiKey) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(apiKey)}`,
      center: [77.23, 28.66],
      zoom: 10,
    });
    const handleLoad = () => {
      mapLoadedRef.current = true;
      setTileError("");
    };
    const handleError = () => {
      if (!mapLoadedRef.current) {
        setTileError("Map tiles could not be loaded. Check the MapTiler key and connection.");
      }
    };
    map.on("load", handleLoad);
    map.on("error", handleError);
    mapRef.current = map;

    return () => {
      map.off("load", handleLoad);
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    if (!areas.length) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const area of areas) {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = styles.marker;
      markerElement.textContent = String(area.reportCount);
      markerElement.setAttribute(
        "aria-label",
        `${area.reportCount} public ${area.reportCount === 1 ? "report" : "reports"} near ${area.name}`,
      );

      const popupContent = document.createElement("div");
      popupContent.className = styles.popup;
      const title = document.createElement("strong");
      title.textContent = area.name;
      const zone = document.createElement("span");
      zone.textContent = area.wardZone;
      const count = document.createElement("span");
      count.textContent = `${area.reportCount} public ${area.reportCount === 1 ? "report" : "reports"} · ${area.openCount} open`;
      popupContent.append(title, zone, count);

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([area.longitude, area.latitude])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setDOMContent(popupContent))
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([area.longitude, area.latitude]);
    }

    if (areas.length === 1) {
      map.easeTo({ center: [areas[0].longitude, areas[0].latitude], zoom: 12 });
    } else {
      map.fitBounds(bounds, { padding: 56, maxZoom: 12 });
    }
  }, [areas]);

  const mappedReportCount = areas.reduce((total, area) => total + area.reportCount, 0);

  return (
    <div className={styles.container}>
      <div className={styles.mapFrame}>
        <div ref={containerRef} className={styles.mapCanvas} role="application" aria-label="Map showing public report areas" />
        {mapError && <p className={styles.mapError} role="alert">{mapError}</p>}
      </div>
      <div className={styles.areaSummary} aria-live="polite">
        <strong>{mappedReportCount} reports mapped across {areas.length} {areas.length === 1 ? "area" : "areas"}</strong>
        <span>Markers group reports by privacy-rounded location. Select a marker for area details.</span>
      </div>
      {areas.length > 0 && (
        <div className={styles.areaLegend}>
          {areas.map((area) => (
            <span key={area.key}><i />{area.name} · {area.reportCount}</span>
          ))}
        </div>
      )}
      {!reports.length && <p className={styles.emptyState}>No public report locations are available yet.</p>}
    </div>
  );
}
