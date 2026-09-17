import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin, BedDouble, Bath, Maximize, Building2, Phone, MessageCircle, CheckCircle2,
  CalendarClock, Landmark, TrendingUp, GraduationCap, Hospital, TrainFront, Play, Boxes,
} from "lucide-react";
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
import { useSettings } from "@/context/SettingsContext";
import { waLink } from "@/components/FloatingWhatsApp";

const Spec = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 bg-[#FAFAFA] border border-slate-200 rounded-xl p-4">
    <Icon className="h-5 w-5 text-amber-500" />
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
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const number = settings?.contact?.whatsapp || "971501184777";
  const phone = settings?.contact?.phone || "+971 50 118 4777";

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    api.get(`/properties/${slug}`).then((r) => { setProperty(r.data); setActive(0); }).catch(() => setProperty(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Section><Skeleton className="h-[420px] rounded-2xl" /><Skeleton className="h-8 w-1/2 mt-6" /></Section>;
  if (!property) return <Section><div className="text-center py-24"><h1 className="font-serif text-2xl text-slate-900">Property not found</h1><Link to="/buy" className="text-amber-600 mt-4 inline-block">Browse properties</Link></div></Section>;

  const images = (property.images || []).map(fileUrl);
  const period = property.price_period ? ` ${property.price_period}` : "";
  const schema = {
    "@context": "https://schema.org", "@type": "Residence", name: property.title,
    description: property.description, address: property.location,
  };

  return (
    <div data-testid="property-detail-page">
      <SEO title={`${property.title} | ${property.location} | Homes Finder`} description={property.description?.slice(0, 155)} path={`/property/${property.slug}`} schema={schema} />

      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 text-sm text-slate-500 flex items-center gap-2 flex-wrap" data-testid="breadcrumbs">
          <Link to="/" className="hover:text-amber-600">Home</Link><span>/</span>
          <Link to={property.purpose === "rent" ? "/rent" : "/buy"} className="hover:text-amber-600 capitalize">{property.purpose === "rent" ? "Rent" : "Buy"}</Link><span>/</span>
          <span className="text-slate-800">{property.title}</span>
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
                {property.featured && <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-500">Featured</Badge>}
                {property.status === "offplan" && <Badge className="bg-slate-900 text-white hover:bg-slate-900">Off-Plan</Badge>}
                <Badge variant="outline" className="capitalize">{property.purpose === "rent" ? "For Rent" : "For Sale"}</Badge>
                {property.is_demo && <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-1 rounded">Demo Property</span>}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">{property.title}</h1>
              <p className="flex items-center gap-1.5 text-slate-500 mt-2"><MapPin className="h-4 w-4 text-amber-500" />{property.location}</p>
              <div className="mt-4 font-serif text-3xl font-bold text-amber-600" data-testid="detail-price">{formatAED(property.price)}<span className="text-base font-normal text-slate-500">{period}</span></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

          {/* Sticky enquiry */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" data-testid="enquiry-card">
                <h3 className="font-serif text-xl font-semibold text-slate-900">Request More Information</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Our advisory team will get back to you shortly.</p>
                <LeadForm requirement={`Property Enquiry: ${property.title}`} propertyId={property.id} propertyTitle={property.title} compact submitLabel="Request More Information" />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a href={`tel:${phone.replace(/\s+/g, "")}`} data-testid="detail-call-btn" className="flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg py-3 text-sm font-semibold hover:bg-slate-800"><Phone className="h-4 w-4" /> Call</a>
                  <a href={waLink(number, `Hello Homes Finder, I am interested in "${property.title}" (${property.location}).`)} target="_blank" rel="noopener noreferrer" data-testid="detail-whatsapp-btn" className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#20bd5a]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}
