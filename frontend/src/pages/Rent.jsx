import React from "react";
import SEO from "@/components/SEO";
import { PageHero, Section } from "@/components/Primitives";
import PropertyGrid from "@/components/PropertyGrid";
import CTASection from "@/components/CTASection";

export default function Rent() {
  return (
    <div data-testid="rent-page">
      <SEO title="Rent Property in Dubai & UAE | Homes Finder" description="Find your next home or commercial space to rent across the UAE — apartments, villas, offices, retail and warehouses." path="/rent" />
      <PageHero eyebrow="Rent" title="Find Your Next Home or Commercial Space" subtitle="Residential and commercial rental opportunities across the UAE — filter by location, type, budget and availability." image="https://images.unsplash.com/photo-1743819455744-05417bf55cea?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />
      <Section>
        <PropertyGrid fixed={{ purpose: "rent" }} />
      </Section>
      <CTASection waContext="rent" />
    </div>
  );
}
