import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function MapEmbed({ lat, lng, address, className = "h-72" }) {
  const { settings } = useSettings();
  const la = lat ?? settings?.map?.lat ?? 25.0784;
  const ln = lng ?? settings?.map?.lng ?? 55.1408;
  const directUrl = settings?.map?.url || `https://maps.google.com/?q=${la},${ln}`;

  const query = address ? encodeURIComponent(address) : `${la},${ln}`;
  const mapSrc = `https://maps.google.com/maps?q=${query}&hl=en&z=14&output=embed`;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 ${className}`} data-testid="map-embed">
      <iframe
        title="Location map"
        src={mapSrc}
        className="h-full w-full border-0"
        loading="lazy"
        allowFullScreen
      />
      <a
        href={directUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="map-link"
        className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5 transition-all"
      >
        <MapPin className="h-3.5 w-3.5 text-amber-500" />
        Open in Google Maps
        <ExternalLink className="h-3 w-3 text-slate-400" />
      </a>
    </div>
  );
}
