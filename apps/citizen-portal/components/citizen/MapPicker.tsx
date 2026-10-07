"use client";
import { useRef, useEffect, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Tell MapLibre to load the worker from public/ instead of via bundler
(maplibregl as any).config.WORKER_URL = "/maplibre-worker.mjs";

interface MapPickerProps {
  lat: number;
  lng: number;
  address: string;
  onMove: (lat: number, lng: number) => void;
  onAddressChange: (address: string) => void;
  apiKey: string;
}

export default function MapPicker({ lat, lng, address, onMove, onAddressChange, apiKey }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const isMoveFromCode = useRef(false);

  // ── Initialize map once ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [lng, lat],
      zoom: 14,
    });

    // Draggable red pin
    const marker = new maplibregl.Marker({ color: "#ef4444", draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    // When user drags the pin → update coords
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onMove(lngLat.lat, lngLat.lng);
    });

    // When user pans the map → keep pin in centre, update coords
    map.on("moveend", () => {
      if (isMoveFromCode.current) {
        isMoveFromCode.current = false;
        return;
      }
      const center = map.getCenter();
      marker.setLngLat([center.lng, center.lat]);
      onMove(center.lat, center.lng);
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Geocode address using MapTiler Geocoding API ─────────────────
  const geocode = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return;
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&limit=1`
      );
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) return;

      const [newLng, newLat] = feature.center as [number, number];

      // Fly the map to the geocoded location
      isMoveFromCode.current = true;
      mapRef.current?.flyTo({ center: [newLng, newLat], zoom: 15, duration: 1200 });
      markerRef.current?.setLngLat([newLng, newLat]);
      onMove(newLat, newLng);
    } catch {
      // geocoding failed silently
    }
  }, [apiKey, onMove]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* ── Address search input ── */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); geocode(address); } }}
          placeholder="Type address and press Enter to locate on map…"
          style={{
            flex: 1,
            background: "var(--surface, #1a1a1a)",
            border: "1px solid var(--border, #333)",
            color: "var(--text, #fff)",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        />
        <button
          type="button"
          onClick={() => geocode(address)}
          style={{
            background: "var(--accent, #22c55e)",
            color: "#000",
            border: "none",
            padding: "0.5rem 0.85rem",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ⌖ Locate
        </button>
      </div>

      {/* ── Map canvas ── */}
      <div
        ref={containerRef}
        style={{
          height: "220px",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid var(--border, #333)",
        }}
      />

      <small style={{ color: "var(--muted, #888)", fontSize: "10px" }}>
        {lat.toFixed(5)}° N, {lng.toFixed(5)}° E · Pan map or drag the pin to adjust
      </small>
    </div>
  );
}
