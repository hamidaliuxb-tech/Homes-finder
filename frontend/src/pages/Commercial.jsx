import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Store, Warehouse, Factory, LandPlot, BedDouble, Hotel, HardHat, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import PropertyGrid from "@/components/PropertyGrid";
import CTASection from "@/components/CTASection";

const CATS = [
  { icon: Building2, title: "Offices" }, { icon: Store, title: "Retail" }, { icon: Warehouse, title: "Warehouses" },
  { icon: Factory, title: "Industrial" }, { icon: LandPlot, title: "Land" }, { icon: BedDouble, title: "Staff Accommodation" },
  { icon: Hotel, title: "Hotels" }, { icon: HardHat, title: "Development Opportunities" }, { icon: Landmark, title: "Investment Buildings" },
];

export default function Commercial() {
  const navigate = useNavigate();
  return (
    <div data-testid="commercial-page">
      <SEO title="Commercial Real Estate in the UAE | Homes Finder" description="Commercial real estate across the UAE — offices, retail, warehouses, industrial, land, hotels and investment buildings for SMEs, corporates and investors." path="/commercial" />
      <PageHero eyebrow="Commercial" title="Commercial Real Estate Across the UAE" subtitle="Offices, retail, warehouses, land and investment buildings for SMEs, corporates, investors, developers and family offices." image="https://images.unsplash.com/flagged/photo-1559717865-a99cac1c95d8?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000">
        <Button onClick={() => navigate("/contact")} data-testid="commercial-discuss-btn" className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold rounded-full px-7 h-12">Discuss a Commercial Requirement</Button>
      </PageHero>

      <Section>
        <SectionHeading eyebrow="Categories" title="Commercial Property Types" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
          {CATS.map((c, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-amber-400 hover:shadow-lg transition-all flex items-center gap-4" data-testid={`commercial-cat-${i}`}>
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0"><c.icon className="h-5 w-5 text-amber-400" /></div>
              <span className="font-serif text-lg font-semibold text-slate-900">{c.title}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <SectionHeading eyebrow="Available Now" title="Commercial Listings" />
        <PropertyGrid fixed={{ category: "commercial" }} />
      </Section>
      <CTASection title="Have a Commercial Requirement?" text="Tell us about your office, retail, warehouse or investment building requirement and our team will source suitable opportunities." waContext="general" />
    </div>
  );
}
