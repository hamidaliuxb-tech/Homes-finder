import React from "react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import PropertyGrid from "@/components/PropertyGrid";
import ROICalculator from "@/components/ROICalculator";
import CTASection from "@/components/CTASection";

export default function Rent() {
  return (
    <div data-testid="rent-page">
      <SEO title="Rent Property in Dubai & UAE | Homes Finder" description="Find your next home or commercial space to rent across the UAE — apartments, villas, offices, retail and warehouses." path="/rent" />
      <PageHero eyebrow="Rent" title="Find Your Next Home or Commercial Space" subtitle="Residential and commercial rental opportunities across the UAE — filter by location, type, budget and availability." image="https://images.unsplash.com/photo-1743819455744-05417bf55cea?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />
      <Section>
        <PropertyGrid fixed={{ purpose: "rent" }} />
      </Section>
      <Section className="bg-[#FAFAFA] border-t border-slate-200">
        <SectionHeading
          eyebrow="Rental Yield Calculator"
          title="Estimate Tenant & Investor Rental Returns"
          subtitle="Compare annual lease values against property purchase benchmarks across prime UAE areas."
          centered
        />
        <div className="max-w-4xl mx-auto mt-8">
          <ROICalculator
            initialPrice="1950000"
            initialRent="145000"
            title="Rental Returns & Yield Calculator"
            subtitle="Benchmark annual rental income against asset value with realistic yield percentages."
          />
        </div>
      </Section>
      <CTASection waContext="rent" />
    </div>
  );
}
