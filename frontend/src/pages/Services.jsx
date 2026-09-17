import React from "react";
import {
  Calculator, Megaphone, UserCheck, Users, KeyRound, LineChart,
  Layers, Building2, ClipboardCheck, FileSignature,
} from "lucide-react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import CTASection from "@/components/CTASection";

const SERVICES = [
  { icon: Calculator, title: "Property Valuation", desc: "Market-based assessment of your property's value." },
  { icon: Megaphone, title: "Property Marketing", desc: "Targeted exposure to qualified buyers and tenants." },
  { icon: UserCheck, title: "Buyer Representation", desc: "Advocacy and guidance throughout your purchase." },
  { icon: Users, title: "Seller Representation", desc: "End-to-end support to market and sell your property." },
  { icon: KeyRound, title: "Leasing", desc: "Residential and commercial leasing support." },
  { icon: LineChart, title: "Property Investment Advisory", desc: "Structured analysis of investment opportunities." },
  { icon: Layers, title: "Off-Plan Advisory", desc: "Evaluation of developer projects and payment plans." },
  { icon: Building2, title: "Commercial Real Estate", desc: "Office, retail, warehouse and investment assets." },
  { icon: ClipboardCheck, title: "Property Management Support", desc: "Coordination support for property owners." },
  { icon: FileSignature, title: "Documentation & Transaction Coordination", desc: "Guidance through paperwork and completion." },
];

export default function Services() {
  return (
    <div data-testid="services-page">
      <SEO title="Property Services in the UAE | Homes Finder" description="Comprehensive real estate services: valuation, marketing, buyer & seller representation, leasing, investment advisory, off-plan advisory and transaction coordination." path="/services" />
      <PageHero eyebrow="Property Services" title="End-to-End Real Estate Services" subtitle="From valuation to transaction completion, we support every stage of your property journey." image="https://images.unsplash.com/photo-1757405909200-5f19f1f39eae?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />
      <Section>
        <SectionHeading eyebrow="What We Offer" title="Our Services" center />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-xl hover:border-amber-400/60 transition-all" data-testid={`service-${i}`}>
              <div className="w-12 h-12 rounded-xl bg-[#FAF5E8] flex items-center justify-center mb-5"><s.icon className="h-6 w-6 text-amber-600" /></div>
              <h3 className="font-serif text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>
      <CTASection />
    </div>
  );
}
