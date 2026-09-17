import React from "react";
import { CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import PropertyGrid from "@/components/PropertyGrid";
import CTASection from "@/components/CTASection";

const WHY_BUY = [
  "Market knowledge", "Property due diligence support", "Negotiation assistance",
  "Financing coordination", "Documentation guidance", "Transaction support", "Post-sale assistance",
];

export default function Buy() {
  return (
    <div data-testid="buy-page">
      <SEO title="Buy Property in Dubai & UAE | Homes Finder" description="Find the right property to buy in the UAE — apartments, villas, townhouses, penthouses, land and commercial investment properties." path="/buy" />
      <PageHero eyebrow="Buy" title="Find the Right Property to Buy in the UAE" subtitle="Apartments, villas, townhouses, penthouses, luxury homes, land, commercial and investment properties — matched to your goals." image="https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />
      <Section>
        <PropertyGrid fixed={{ purpose: "buy" }} />
      </Section>
      <Section className="bg-white">
        <SectionHeading eyebrow="Advisory" title="Why Buy Through Homes Finder?" subtitle="We support you across every stage of your property purchase." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY_BUY.map((w, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#FAFAFA] border border-slate-200 rounded-xl p-5" data-testid={`buy-benefit-${i}`}>
              <CheckCircle2 className="h-6 w-6 text-amber-500 shrink-0" />
              <span className="text-slate-800 font-medium">{w}</span>
            </div>
          ))}
        </div>
      </Section>
      <CTASection waContext="buy" />
    </div>
  );
}
