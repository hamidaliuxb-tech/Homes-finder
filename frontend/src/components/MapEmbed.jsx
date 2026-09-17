import React from "react";
import { useSettings } from "@/context/SettingsContext";

export default function MapEmbed({ lat, lng, address, className = "h-72" }) {
  const { settings } = useSettings();
  const la = lat ?? settings?.map?.lat;
  const ln = lng ?? settings?.map?.lng;
  const url = settings?.map?.url;

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`block rounded-2xl overflow-hidden border border-slate-200 ${className}`} data-testid="map-link">
        <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm">Open location in Google Maps</div>
      </a>
    );
  }
  if (la == null || ln == null) {
    return <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-sm ${className}`} data-testid="map-placeholder">Map location not set</div>;
  }
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${ln - 0.01}%2C${la - 0.01}%2C${ln + 0.01}%2C${la + 0.01}&layer=mapnik&marker=${la}%2C${ln}`;
  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 ${className}`} data-testid="map-embed">
      <iframe title="Location map" src={src} className="h-full w-full" loading="lazy" />
    </div>
  );
}
