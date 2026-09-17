import React from "react";
import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import LeadForm from "@/components/LeadForm";
import MapEmbed from "@/components/MapEmbed";
import { useSettings } from "@/context/SettingsContext";
import { waLink } from "@/components/FloatingWhatsApp";

export default function Contact() {
  const { settings } = useSettings();
  const c = settings?.contact || {};

  return (
    <div data-testid="contact-page">
      <SEO title="Contact Homes Finder | UAE Real Estate Advisory" description="Contact Homes Finder for property buying, selling, renting and investment advisory across the UAE. Book a consultation or request more information." path="/contact" />
      <PageHero eyebrow="Contact" title="Let's Talk About Your Property Goals" subtitle="Book a consultation, request a valuation or ask us anything — a visitor can submit an enquiry in under 30 seconds." image="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />

      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionHeading eyebrow="Get In Touch" title="Book a Consultation" subtitle="Share your requirement and our advisory team will respond promptly." />
            <div className="space-y-4">
              {c.phone && (
                <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 transition-colors" data-testid="contact-phone">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Phone className="h-5 w-5 text-amber-400" /></div>
                  <div><div className="text-xs text-slate-500 uppercase tracking-wide">Call</div><div className="font-semibold text-slate-900">{c.phone}</div></div>
                </a>
              )}
              {c.whatsapp && (
                <a href={waLink(c.whatsapp, "Hello Homes Finder, I would like to book a consultation.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 transition-colors" data-testid="contact-whatsapp">
                  <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center"><MessageCircle className="h-5 w-5 text-white" /></div>
                  <div><div className="text-xs text-slate-500 uppercase tracking-wide">WhatsApp</div><div className="font-semibold text-slate-900">Chat with us</div></div>
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-amber-400 transition-colors" data-testid="contact-email">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Mail className="h-5 w-5 text-amber-400" /></div>
                  <div><div className="text-xs text-slate-500 uppercase tracking-wide">Email</div><div className="font-semibold text-slate-900 break-all">{c.email}</div></div>
                </a>
              )}
              {c.address && (
                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5" data-testid="contact-address">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><MapPin className="h-5 w-5 text-amber-400" /></div>
                  <div><div className="text-xs text-slate-500 uppercase tracking-wide">Office</div><div className="font-semibold text-slate-900">{c.address}</div></div>
                </div>
              )}
              {c.hours && (
                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5" data-testid="contact-hours">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-400" /></div>
                  <div><div className="text-xs text-slate-500 uppercase tracking-wide">Business Hours</div><div className="font-semibold text-slate-900">{c.hours}</div></div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <LeadForm requirement="Consultation Booking" submitLabel="Book a Consultation" />
          </div>
        </div>

        <div className="mt-12">
          <MapEmbed className="h-80" />
        </div>
      </Section>
    </div>
  );
}
