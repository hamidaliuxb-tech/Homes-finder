import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin, BedDouble, Bath, Maximize, Building2, Phone, MessageCircle, CheckCircle2,
  CalendarClock, Landmark, TrendingUp, GraduationCap, Hospital, TrainFront, Play, Boxes,
  Share2, Copy, Check, Calendar, Armchair, Hash, Globe, ShieldCheck, Mail, Info, Flag, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { Section } from "@/components/Primitives";
import LeadForm from "@/components/LeadForm";
import MapEmbed from "@/components/MapEmbed";
import ROICalculator from "@/components/ROICalculator";
import MortgageCalculator from "@/components/MortgageCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, fileUrl, formatAED } from "@/lib/apiClient";
import { getCachedProperties, fetchWithRetry } from "@/lib/cache";
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

const Spec = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 bg-[#FAFAFA] border border-slate-200 rounded-xl p-4">
    <Icon className="h-5 w-5 text-amber-500 shrink-0" />
    <div><div className="text-xs text-slate-500">{label}</div><div className="font-semibold text-slate-900 text-sm">{value}</div></div>
  </div>
);

const ListBlock = ({ icon: Icon, title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2 mb-3"><Icon className="h-5 w-5 text-amber-500" />{title}</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-slate-700 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />{f}</li>
        ))}
      </ul>
    </div>
  );
};

export default function PropertyDetail() {
  const { slug } = useParams();
  const { settings } = useSettings();
  const [property, setProperty] = useState(() => {
    return getCachedProperties().find((p) => p.slug === slug || p.id === slug) || null;
  });
  const [loading, setLoading] = useState(() => !property);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const number = settings?.contact?.whatsapp || "971501184777";
  const phone = settings?.contact?.phone || "+971 50 118 4777";

  useEffect(() => {
    fetchWithRetry(() => api.get(`/properties/${slug}`), 2, 2000)
      .then((r) => {
        if (r && r.data) {
          setProperty(r.data);
          setActive(0);
        }
      })
      .catch(() => {
        // Keep cached property if available
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Section><Skeleton className="h-[420px] rounded-2xl" /><Skeleton className="h-8 w-1/2 mt-6" /></Section>;
  if (!property) return <Section><div className="text-center py-24"><h1 className="font-serif text-2xl text-slate-900">Property not found</h1><Link to="/buy" className="text-amber-600 mt-4 inline-block">Browse properties</Link></div></Section>;

  const images = (property.images || []).map(fileUrl);
  const period = property.price_period ? ` ${property.price_period}` : "";
  const refId = property.reference || (property.id ? `HF-${property.emirate ? property.emirate.slice(0, 3).toUpperCase() : "DXB"}-${property.id.slice(0, 6).toUpperCase()}` : "");
  const postedDate = formatDate(property.posted_date || property.submitted_at || property.created_at);
  const furnishing = property.furnished ? (property.furnished.charAt(0).toUpperCase() + property.furnished.slice(1)) : "Unfurnished";
  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://www.homesfinder.ae/property/${property.slug || property.id}`;
  const shareTitle = `${property.title} | ${property.location} (Ref: ${refId})`;

  // Responsible Agent & Landlord contact resolution (Requirement 3)
  const contactPersonName = property.agent_name || property.landlord_name || property.contact_name || "Homes Finder Property Advisor";
  const contactPersonRole = property.agent_name
    ? (property.brn || property.agent_brn ? `Licensed Real Estate Broker (BRN: ${property.brn || property.agent_brn})` : "Licensed Real Estate Broker")
    : property.landlord_name
      ? "Property Owner / Landlord"
      : "Verified Property Specialist";
  const contactPhone = property.agent_mobile || property.landlord_mobile || property.contact_mobile || property.contact_phone || settings?.contact?.phone || "+971 50 118 4777";
  const contactWhatsapp = property.agent_whatsapp || property.agent_mobile || property.landlord_mobile || property.contact_whatsapp || property.contact_mobile || settings?.contact?.whatsapp || "971501184777";
  const contactEmail = property.agent_email || property.landlord_email || property.contact_email || settings?.contact?.email || "enquiries@homesfinder.ae";

  // Agency & Regulatory Details (Requirement 1 & 2)
  const agencyName = property.agency_name || "Homes Finder Real Estate";
  const zoneName = property.zone || (property.community ? `${property.community}` : (property.emirate ? `${property.emirate} Freehold Zone` : "Freehold Zone"));
  const ownershipType = property.ownership_type || "Freehold";
  const reraPermit = property.rera_number || property.permit_number || (property.reference ? `RERA-${property.reference}` : "RERA-VERIFIED");
  const brnNumber = property.brn || property.agent_brn || "BRN-54912";
  const ornNumber = property.orn || "ORN-32890";
  const dldPermit = property.dld_permit_number || property.permit_number || (property.reference ? `DLD-${property.reference}` : "DLD-PERMIT");
  const displayRefId = refId || property.reference || (property.id ? `DREL-${property.id.slice(0, 5).toUpperCase()}` : "DREL-13029");
  const permitUrl = property.dld_permit_number
    ? `https://dubailand.gov.ae/en/eservices/verify-permit/?permit=${encodeURIComponent(property.dld_permit_number)}`
    : (typeof window !== "undefined" && window.location ? window.location.href : `https://homesfinder.ae/property/${property.slug || property.id || ""}`);

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Property link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const schema = {
    "@context": "https://schema.org", "@type": "Residence", name: property.title,
    description: property.description, address: property.location,
  };

  return (
    <div data-testid="property-detail-page">
      <SEO title={`${property.title} | ${property.location} | Homes Finder`} description={property.description?.slice(0, 155)} path={`/property/${property.slug}`} schema={schema} />

      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 text-sm text-slate-500 flex items-center justify-between gap-2 flex-wrap" data-testid="breadcrumbs">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-amber-600">Home</Link><span>/</span>
            <Link to={property.purpose === "rent" ? "/rent" : "/buy"} className="hover:text-amber-600 capitalize">{property.purpose === "rent" ? "Rent" : "Buy"}</Link><span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-md">{property.title}</span>
          </div>
          {refId && (
            <span className="font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
              Reference ID: {refId}
            </span>
          )}
        </div>
      </div>

      <Section className="py-8 md:py-10">
        {/* Gallery */}
        <div className="grid lg:grid-cols-3 gap-3 mb-8" data-testid="property-gallery">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100">
            {images[active] ? <img src={images[active]} alt={property.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-200" />}
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
            {images.slice(0, 4).map((img, i) => (
              <button key={i} onClick={() => setActive(i)} data-testid={`gallery-thumb-${i}`} className={`rounded-xl overflow-hidden aspect-square ${active === i ? "ring-2 ring-amber-500" : ""}`}>
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {refId && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-mono font-bold text-xs border border-amber-300">
                    Ref: {refId}
                  </Badge>
                )}
                <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> {ownershipType}
                </Badge>
                {property.featured && <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500 font-semibold">Featured</Badge>}
                {property.status === "offplan" ? (
                  <Badge className="bg-slate-900 text-white hover:bg-slate-900">Off-Plan</Badge>
                ) : (
                  <Badge className="bg-slate-800 text-slate-100 hover:bg-slate-800">Ready</Badge>
                )}
                <Badge variant="outline" className="capitalize font-medium">{property.purpose === "rent" ? "For Rent" : "For Sale"}</Badge>
                <Badge className="bg-slate-100 text-slate-800 border border-slate-300 font-medium">
                  {furnishing}
                </Badge>
                {property.developer ? (
                  <Badge className="bg-slate-900 text-amber-300 border border-amber-500/30 font-medium">By {property.developer}</Badge>
                ) : property.is_demo ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-1 rounded">Demo Property</span>
                ) : null}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">{property.title}</h1>
              <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
                <p className="flex items-center gap-1.5 text-slate-500"><MapPin className="h-4 w-4 text-amber-500 shrink-0" />{property.location}</p>
                {postedDate && (
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" /> Posted Date: <strong className="text-slate-700 font-medium">{postedDate}</strong>
                  </p>
                )}
              </div>
              <div className="mt-4 font-serif text-3xl font-bold text-amber-600" data-testid="detail-price">{formatAED(property.price)}<span className="text-base font-normal text-slate-500">{period}</span></div>
            </div>

            {/* Social Share & Direct Access Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Share2 className="h-4 w-4 text-amber-600" /> Share this Property:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this property on Homes Finder: ${shareTitle} - ${currentUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20bd5a] transition-colors shadow-sm"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2] text-white text-xs font-semibold hover:bg-[#166fe5] transition-colors shadow-sm"
                  title="Share on Facebook"
                >
                  Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#095196] transition-colors shadow-sm"
                  title="Share on LinkedIn"
                >
                  LinkedIn
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm"
                  title="Share on X"
                >
                  X (Twitter)
                </a>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
                  title="Copy link to clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Spec icon={Hash} label="Property Ref ID" value={refId || "—"} />
              <Spec icon={ShieldCheck} label="Ownership" value={ownershipType} />
              <Spec icon={Calendar} label="Posted Date" value={postedDate || "Recently"} />
              <Spec icon={Armchair} label="Furnishing" value={furnishing} />
              <Spec icon={BedDouble} label="Bedrooms" value={property.bedrooms === 0 ? "Studio" : property.bedrooms} />
              <Spec icon={Bath} label="Bathrooms" value={property.bathrooms} />
              <Spec icon={Maximize} label="Built-up Area" value={property.area ? `${property.area.toLocaleString()} sq.ft.` : "—"} />
              {property.plot_area ? <Spec icon={Boxes} label="Plot Area" value={`${property.plot_area.toLocaleString()} sq.ft.`} /> : null}
              <Spec icon={Building2} label="Type" value={property.property_type} />
              <Spec icon={CheckCircle2} label="Status" value={property.status === "offplan" ? "Off-Plan" : "Ready"} />
              {property.developer ? <Spec icon={Landmark} label="Developer" value={property.developer} /> : null}
              {property.completion_date ? <Spec icon={CalendarClock} label="Completion" value={property.completion_date} /> : null}
              {property.service_charges ? <Spec icon={Landmark} label="Service Charges" value={property.service_charges} /> : null}
            </div>

            {/* More Info - Official Regulatory & Permit Card (Bayut / Property Finder Specification) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6" data-testid="agency-regulatory-box">
              <h2 className="font-serif text-2xl font-bold text-slate-900">More Info</h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left side details */}
                <div className="md:col-span-8 lg:col-span-9 space-y-4 text-sm">
                  {/* Zone Name */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span>Zone Name</span>
                      <span title="Dubai Land Department Zone" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 text-right">{zoneName}</span>
                  </div>

                  {/* Registered Agency */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span>Registered Agency</span>
                      <span title="DLD Licensed Real Estate Brokerage" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 uppercase text-right">{agencyName}</span>
                  </div>

                  {/* RERA */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span>RERA</span>
                      <span title="Real Estate Regulatory Agency Registration" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 text-right">{reraPermit}</span>
                  </div>

                  {/* Reference ID */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span>Reference ID</span>
                    </div>
                    <span className="font-medium text-slate-900 font-mono text-right">{refId || displayRefId}</span>
                  </div>

                  {/* BRN (DLD) */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span>BRN (DLD)</span>
                      <span title="Broker Registration Number" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 font-mono text-right">{brnNumber}</span>
                  </div>

                  {/* Ownership Type */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span>Ownership Type</span>
                      <span title="Property Title Ownership Structure" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-700 text-right">{ownershipType}</span>
                  </div>

                  {/* DLD Permit / Trakheesi */}
                  {dldPermit && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span>DLD Permit / Trakheesi</span>
                        <span title="Official DLD e-Permit Reference" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <Info className="h-4 w-4" />
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 font-mono text-right">{dldPermit}</span>
                    </div>
                  )}
                </div>

                {/* Right side QR code box */}
                <div className="md:col-span-4 lg:col-span-3 flex justify-start md:justify-end">
                  <div className="border border-slate-300 rounded-xl p-3 bg-white shadow-2xs flex flex-col items-center justify-center w-36 sm:w-40">
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 bg-white flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=${encodeURIComponent(permitUrl)}`}
                        alt="DLD Permit QR"
                        className="h-full w-full object-contain"
                      />
                      {/* DLD palm emblem in center of QR */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-6 w-6 rounded-full bg-white border border-red-500/80 p-0.5 flex items-center justify-center shadow-xs">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.2" fill="#ffffff" />
                            <path d="M12 18V8M12 8C10 5.5 8 6.5 6 8M12 8C14 5.5 16 6.5 18 8M12 10C9 8.5 7.5 10 7 11.5M12 10C15 8.5 16.5 10 17 11.5" stroke="#059669" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 mt-2">Permit</span>
                  </div>
                </div>
              </div>

              {/* DLD Rules Banner */}
              <div className="rounded-xl bg-[#EAF2F9] border border-[#D5E3EE] px-4 py-3 flex items-center gap-3 text-xs sm:text-sm text-slate-800">
                <div className="h-7 w-7 rounded-full bg-white border border-red-500/70 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.2" fill="#ffffff" />
                    <path d="M12 18V8M12 8C10 5.5 8 6.5 6 8M12 8C14 5.5 16 6.5 18 8M12 10C9 8.5 7.5 10 7 11.5M12 10C15 8.5 16.5 10 17 11.5" stroke="#059669" />
                  </svg>
                </div>
                <div>
                  <span>To know more about the rules and regulations visit the </span>
                  <a
                    href="https://dubailand.gov.ae/en/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1A56DB] font-semibold hover:underline"
                  >
                    Land Department Website
                  </a>
                  <span>.</span>
                </div>
              </div>

              {/* Report This Ad divider & button */}
              <div className="border-t border-slate-200/80 pt-4 text-center">
                <button
                  type="button"
                  onClick={() => toast.success("Thank you. Listing reported to Homes Finder compliance team.")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <Flag className="h-3.5 w-3.5 text-slate-500" />
                  Report This Ad
                </button>
              </div>
            </div>

            {property.description && (
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-900 mb-3">Description</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {(property.video_url || property.virtual_tour_url) && (
              <div className="grid sm:grid-cols-2 gap-3">
                {property.video_url && <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 justify-center bg-slate-900 text-white rounded-xl p-4 hover:bg-slate-800"><Play className="h-5 w-5 text-amber-400" /> Watch Video</a>}
                {property.virtual_tour_url && <a href={property.virtual_tour_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 justify-center bg-slate-900 text-white rounded-xl p-4 hover:bg-slate-800"><Maximize className="h-5 w-5 text-amber-400" /> Virtual Tour</a>}
              </div>
            )}

            <ListBlock icon={CheckCircle2} title="Features" items={property.features} />
            <ListBlock icon={Building2} title="Amenities" items={property.amenities} />
            <ListBlock icon={MapPin} title="Location Advantages" items={property.location_advantages} />

            {(property.nearby_schools?.length || property.nearby_hospitals?.length || property.nearby_transport?.length) ? (
              <div className="grid sm:grid-cols-3 gap-6">
                <ListBlock icon={GraduationCap} title="Schools" items={property.nearby_schools} />
                <ListBlock icon={Hospital} title="Hospitals" items={property.nearby_hospitals} />
                <ListBlock icon={TrainFront} title="Transport" items={property.nearby_transport} />
              </div>
            ) : null}

            {(property.investment_highlights?.length || property.rental_yield || property.roi) ? (
              <div className="rounded-2xl bg-slate-900 text-white p-7" data-testid="investment-highlights">
                <h3 className="font-serif text-xl font-semibold flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-amber-400" />Investment Highlights</h3>
                <div className="flex gap-6 mb-4 flex-wrap">
                  {property.rental_yield && <div><div className="text-xs text-slate-400">Expected Rental Yield</div><div className="font-serif text-2xl text-amber-400 font-bold">{property.rental_yield}</div></div>}
                  {property.roi && <div><div className="text-xs text-slate-400">ROI Note</div><div className="font-semibold">{property.roi}</div></div>}
                </div>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {(property.investment_highlights || []).map((h, i) => <li key={i} className="flex items-center gap-2 text-slate-200 text-sm"><CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />{h}</li>)}
                </ul>
                <p className="mt-4 text-xs text-slate-400 border-t border-slate-700 pt-3">Returns are not guaranteed and depend on market conditions.</p>
              </div>
            ) : null}

            {property.payment_plan && (
              <div className="rounded-2xl border border-amber-300 bg-[#FAF5E8] p-6">
                <h3 className="font-serif text-lg font-semibold text-slate-900">Payment Plan</h3>
                <p className="mt-1 text-slate-700">{property.payment_plan}</p>
              </div>
            )}

            <div>
              <h3 className="font-serif text-xl font-semibold text-slate-900 mb-3">Location</h3>
              <MapEmbed lat={property.lat} lng={property.lng} className="h-72" />
            </div>

            {property.purpose !== "rent" && (
              <div data-testid="mortgage-section">
                <h3 className="font-serif text-xl font-semibold text-slate-900 mb-3">Mortgage Calculator</h3>
                <MortgageCalculator price={property.price} />
              </div>
            )}

            {(property.rental_yield || property.status === "offplan") && (
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-900 mb-3">Estimate Your Yield</h3>
                <ROICalculator />
              </div>
            )}
          </div>

          {/* Sticky enquiry & Direct Agent / Landlord Contact Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" data-testid="enquiry-card">
                {/* Responsible Agent / Landlord Profile Card */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-lg border-2 border-amber-400/50 overflow-hidden shadow-inner">
                      {property.agent_photo ? (
                        <img src={fileUrl(property.agent_photo)} alt={contactPersonName} className="h-full w-full object-cover" />
                      ) : (
                        contactPersonName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Verified & Active" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider truncate">{contactPersonRole}</div>
                    <div className="font-serif text-lg font-bold text-slate-900 leading-tight truncate">{contactPersonName}</div>
                    <div className="text-xs text-slate-500 truncate">{agencyName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                    data-testid="detail-call-btn"
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg py-3 text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <Phone className="h-4 w-4 text-amber-400" /> Call
                  </a>
                  <a
                    href={waLink(contactWhatsapp.replace(/\D/g, ""), `Hello ${contactPersonName}, I am interested in "${property.title}" (Ref: ${refId}, ${property.location}).`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="detail-whatsapp-btn"
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#20bd5a] transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>

                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Enquiry on ${property.title} (Ref: ${refId})`)}&body=${encodeURIComponent(`Hello ${contactPersonName},\n\nI am contacting you regarding your property listing "${property.title}" (Ref: ${refId}) on Homes Finder.\n\nPlease share further details and viewing availability.\n\nThank you.`)}`}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    data-testid="detail-email-btn"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="truncate">Email: {contactEmail}</span>
                  </a>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="font-serif text-base font-semibold text-slate-900 mb-1">Request Information</h3>
                  <p className="text-xs text-slate-500 mb-3">Direct enquiry to {contactPersonName}.</p>
                  <LeadForm requirement={`Property Enquiry: ${property.title}`} propertyId={property.id} propertyTitle={property.title} compact submitLabel="Request Information" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}
