import React from "react";
import { Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize, MessageCircle, Calendar, Armchair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fileUrl, formatAED } from "@/lib/apiClient";
import { useSettings } from "@/context/SettingsContext";
import { waLink } from "@/components/FloatingWhatsApp";

const formatDate = (d) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
};

export default function PropertyCard({ property, index = 0 }) {
  const { settings } = useSettings();
  const number = settings?.contact?.whatsapp || "971501184777";
  const img = property.images?.[0] ? fileUrl(property.images[0]) : "";
  const period = property.price_period ? ` ${property.price_period}` : "";
  const postedDate = formatDate(property.posted_date || property.submitted_at || property.created_at);
  const refId = property.reference || (property.id ? `HF-${property.emirate ? property.emirate.slice(0, 3).toUpperCase() : "DXB"}-${property.id.slice(0, 6).toUpperCase()}` : "");
  const furnishing = property.furnished ? (property.furnished.charAt(0).toUpperCase() + property.furnished.slice(1)) : "Unfurnished";

  return (
    <article
      data-testid={`property-card-${property.id}`}
      className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <Link to={`/property/${property.slug || property.id}`} className="relative block overflow-hidden aspect-[4/3]">
        {img ? (
          <img src={img} alt={property.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {property.featured && <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500 font-semibold shadow-sm">Featured</Badge>}
          {property.status === "offplan" ? (
            <Badge className="bg-slate-900 text-white hover:bg-slate-900 shadow-sm">Off-Plan</Badge>
          ) : (
            <Badge className="bg-slate-800 text-slate-100 hover:bg-slate-800 shadow-sm">Ready</Badge>
          )}
          {property.availability === "sold" && <Badge className="bg-red-600 text-white hover:bg-red-600">Sold</Badge>}
          {property.availability === "rented" && <Badge className="bg-slate-600 text-white hover:bg-slate-600">Rented</Badge>}
        </div>
        {property.developer ? (
          <span className="absolute bottom-3 left-3 text-[11px] font-semibold tracking-wide bg-slate-950/85 backdrop-blur-sm text-amber-300 px-2.5 py-1 rounded border border-amber-500/30 flex items-center gap-1 shadow-sm">
            <span className="text-[9px] uppercase tracking-wider text-slate-300 font-normal">By</span>
            {property.developer}
          </span>
        ) : property.is_demo ? (
          <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/70 text-amber-300 px-2 py-1 rounded">Demo Property</span>
        ) : null}
        <span className="absolute top-3 right-3 text-[11px] font-medium bg-white/95 text-slate-800 px-2.5 py-1 rounded-md shadow-sm border border-slate-200/50 capitalize">
          {property.purpose === "rent" ? "For Rent" : "For Sale"}
        </span>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        {/* Ref ID & Posted Date bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 mb-2 border-b border-slate-100">
          {refId && (
            <span className="font-mono font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60" title="Property Reference ID">
              Ref: {refId}
            </span>
          )}
          {postedDate && (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="h-3 w-3 text-slate-400" /> Posted: {postedDate}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-lg font-bold text-slate-900" data-testid={`property-price-${property.id}`}>
            {formatAED(property.price)}<span className="text-xs font-normal text-slate-500">{period}</span>
          </span>
          <div className="flex items-center gap-1.5 text-right">
            <span className="text-xs text-amber-600 font-medium shrink-0">{property.property_type}</span>
          </div>
        </div>
        <Link to={`/property/${property.slug || property.id}`}>
          <h3 className="font-serif text-lg font-semibold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{property.title}</h3>
        </Link>
        <p className="flex items-center gap-1 text-sm text-slate-500 mt-1 line-clamp-1">
          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" /> {property.location || property.community}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-slate-400" />{property.bedrooms === 0 ? "Studio" : property.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-slate-400" />{property.bathrooms}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-slate-400" />{property.area ? `${property.area.toLocaleString()} sq.ft.` : "—"}</span>
          </div>
          <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
            <Armchair className="h-3 w-3 text-amber-600" /> {furnishing}
          </span>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            to={`/property/${property.slug || property.id}`}
            data-testid={`property-view-btn-${property.id}`}
            className="flex-1 text-center text-sm font-semibold py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            View Property
          </Link>
          <a
            href={waLink(number, `Hello Homes Finder, I am interested in property "${property.title}" (Ref: ${refId || property.id}). URL: https://www.homesfinder.ae/property/${property.slug || property.id}`)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`property-whatsapp-btn-${property.id}`}
            className="flex items-center justify-center w-11 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors shadow-sm"
            aria-label="WhatsApp enquiry"
            title="Enquire on WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  );
}
