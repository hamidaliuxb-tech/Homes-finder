import React from "react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import LeadForm from "@/components/LeadForm";
import { ProcessSteps } from "@/components/InfoBlocks";
import CTASection from "@/components/CTASection";

const STEPS = [
  { title: "Property Consultation" }, { title: "Market Assessment" }, { title: "Property Valuation" },
  { title: "Marketing Strategy" }, { title: "Buyer Qualification" }, { title: "Negotiation" },
  { title: "Documentation" }, { title: "Transaction Completion" },
];

export default function Sell() {
  return (
    <div data-testid="sell-page">
      <SEO title="Sell Your Property in the UAE | Homes Finder" description="Sell your property with confidence. Get professional market guidance, targeted buyer exposure and transaction support from valuation to completion." path="/sell" />
      <PageHero eyebrow="Sell" title="Sell Your Property With Confidence" subtitle="Get professional market guidance, targeted buyer exposure and transaction support from valuation to completion." image="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />

      <Section className="bg-white">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionHeading eyebrow="Request a Property Valuation" title="Tell Us About Your Property" subtitle="Share a few details and our team will prepare a market assessment and pricing strategy for your property." />
            <p className="text-sm text-slate-500">We treat all information confidentially. There is no obligation to list.</p>
          </div>
          <div className="bg-[#FAFAFA] border border-slate-200 rounded-2xl p-6 sm:p-8">
            <LeadForm requirement="Property Valuation / Sell" extended submitLabel="Request a Property Valuation" />
          </div>
        </div>
      </Section>

      <ProcessSteps steps={STEPS} title="Our Selling Process" eyebrow="From Valuation to Completion" />
      <CTASection title="Ready to List Your Property?" text="Speak to our advisory team about the best strategy to market and sell your property in the current UAE market." waContext="sell" />
    </div>
  );
}
