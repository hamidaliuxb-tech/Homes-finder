import React from "react";
import { Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fileUrl, formatAED } from "@/lib/apiClient";
import { useSettings } from "@/context/SettingsContext";
import { waLink } from "@/components/FloatingWhatsApp";

export default function PropertyCard({ property, index = 0 }) {
  const { settings } = useSettings();
  const number = settings?.contact?.whatsapp || "971501184777";
  const img = property.images?.[0] ? fileUrl(property.images[0]) : "";
  const period = property.price_period ? ` ${property.price_period}` : "";

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
        <div className="absolute top-3 left-3 flex gap-2">
          {property.featured && <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500 font-semibold">Featured</Badge>}
          {property.status === "offplan" && <Badge className="bg-slate-900 text-white hover:bg-slate-900">Off-Plan</Badge>}
          {property.availability === "sold" && <Badge className="bg-red-600 text-white hover:bg-red-600">Sold</Badge>}
          {property.availability === "rented" && <Badge className="bg-slate-600 text-white hover:bg-slate-600">Rented</Badge>}
        </div>
        {property.is_demo && (
          <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/70 text-amber-300 px-2 py-1 rounded">Demo Property</span>
        )}
        <span className="absolute top-3 right-3 text-[11px] font-medium bg-white/90 text-slate-700 px-2 py-1 rounded capitalize">
          {property.purpose === "rent" ? "For Rent" : "For Sale"}
        </span>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-lg font-bold text-slate-900" data-testid={`property-price-${property.id}`}>
            {formatAED(property.price)}<span className="text-xs font-normal text-slate-500">{period}</span>
          </span>
          <span className="text-xs text-amber-600 font-medium">{property.property_type}</span>
        </div>
        <Link to={`/property/${property.slug || property.id}`}>
          <h3 className="font-serif text-lg font-semibold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{property.title}</h3>
        </Link>
        <p className="flex items-center gap-1 text-sm text-slate-500 mt-1 line-clamp-1">
          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" /> {property.location || property.community}
        </p>

        <div className="flex items-center gap-4 text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-slate-400" />{property.bedrooms === 0 ? "Studio" : property.bedrooms}</span>
          <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-slate-400" />{property.bathrooms}</span>
          <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4 text-slate-400" />{property.area ? `${property.area.toLocaleString()} sq.ft.` : "—"}</span>
        </div>

        <div className="flex gap-2 mt-5">
          <Link
            to={`/property/${property.slug || property.id}`}
            data-testid={`property-view-btn-${property.id}`}
            className="flex-1 text-center text-sm font-semibold py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            View Property
          </Link>
          <a
            href={waLink(number, `Hello Homes Finder, I am interested in "${property.title}" (${property.location}).`)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`property-whatsapp-btn-${property.id}`}
            className="flex items-center justify-center w-11 rounded-lg bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
            aria-label="WhatsApp enquiry"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  );
}
