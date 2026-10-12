"use client";
import { useRef, useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

(maplibregl as any).config.WORKER_URL = "/maplibre-worker.mjs";

interface ReportPoint {
  id: string;
  lat: number;
  lng: number;
  weight: number;
}

interface HeatmapProps {
  apiKey: string;
}

export default function HotspotMap({ apiKey }: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  // Fetch real data from database
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${apiKey}`,
      center: [77.231, 28.628], // Central Delhi
      zoom: 10.5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Fetch Real Database Data Only
      fetch("/api/reports?limit=500")
        .then((r) => r.json())
        .then((json) => {
          let dbPoints: ReportPoint[] = [];
          const reportsArray = json.data?.reports;
          if (reportsArray && Array.isArray(reportsArray)) {
            dbPoints = reportsArray
              .filter((r: any) => r.location?.latitude && r.location?.longitude)
              .map((r: any) => ({
                id: r.reportId,
                lat: parseFloat(r.location.latitude),
                lng: parseFloat(r.location.longitude),
                weight: r.severity === "Critical / Hazardous" ? 1.0 : 0.6,
              }));
          }
          renderHeatmap(map, dbPoints);
        })
        .catch(() => {
          // If API fails, just render empty map
          renderHeatmap(map, []);
        });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderHeatmap = (map: maplibregl.Map, points: ReportPoint[]) => {
    setTotalPoints(points.length);
    
    // Convert to GeoJSON FeatureCollection
    const geojson: any = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { weight: p.weight },
      })),
    };

    map.addSource("reports-source", {
      type: "geojson",
      data: geojson,
    });

    map.addLayer({
      id: "reports-heat",
      type: "heatmap",
      source: "reports-source",
      maxzoom: 18,
      paint: {
        // Weight based on severity
        "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
        // Global intensity by zoom
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 3],
        // Color gradient from transparent green -> yellow -> orange -> red
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(46, 125, 50, 0)", // #2E7D32 with 0 opacity
          0.2, "rgb(46, 125, 50)",    // Green
          0.5, "rgb(253, 216, 53)",   // Yellow (#FDD835)
          0.8, "rgb(251, 140, 0)",    // Orange (#FB8C00)
          1.0, "rgb(211, 47, 47)"     // Red (#D32F2F)
        ],
        // Radius scales with zoom for a natural heat field
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 20, 15, 60],
        // Opacity transition
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 18, 0.7],
      },
    });
  };

  return (
    <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b", background: "#0f172a" }}>
      {/* Map canvas */}
      <div ref={containerRef} style={{ height: "460px", width: "100%" }} />

      {/* Heatmap Legend */}
      <div style={{
        position: "absolute", bottom: "24px", right: "24px",
        background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", border: "1px solid #334155",
        borderRadius: "8px", padding: "12px 16px", color: "#f8fafc", fontSize: "11px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)", zIndex: 10, width: "320px",
      }}>
        <div style={{ fontWeight: 700, marginBottom: "8px", letterSpacing: "0.05em", color: "#cbd5e1" }}>COMPLAINT DENSITY</div>
        <div style={{
          height: "8px", width: "100%", borderRadius: "4px",
          background: "linear-gradient(to right, rgba(46, 125, 50, 0), rgb(46, 125, 50), rgb(253, 216, 53), rgb(251, 140, 0), rgb(211, 47, 47))",
          marginBottom: "6px"
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "10px" }}>
          <span>Low (Green)</span>
          <span>Moderate (Yellow)</span>
          <span>High (Orange)</span>
          <span>Critical Hotspot (Red)</span>
        </div>
      </div>

      {/* Total metric */}
      <div style={{
        position: "absolute", top: "24px", left: "24px",
        background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", border: "1px solid #334155",
        borderRadius: "8px", padding: "12px 16px", color: "#f8fafc",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)", zIndex: 10,
      }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", marginBottom: "2px" }}>ACTIVE ZONES</div>
        <div style={{ fontSize: "24px", fontWeight: 800, color: "#fff", display: "flex", alignItems: "baseline", gap: "6px" }}>
          {totalPoints} <span style={{ fontSize: "12px", fontWeight: 500, color: "#cbd5e1" }}>geotagged reports</span>
        </div>
      </div>
    </div>
  );
}
