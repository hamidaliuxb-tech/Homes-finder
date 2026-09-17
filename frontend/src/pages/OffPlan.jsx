import React from "react";
import SEO from "@/components/SEO";
import { PageHero, Section, SectionHeading } from "@/components/Primitives";
import PropertyGrid from "@/components/PropertyGrid";
import CTASection from "@/components/CTASection";

export default function OffPlan() {
  return (
    <div data-testid="offplan-page">
      <SEO title="Off-Plan Properties in Dubai & UAE | Homes Finder" description="Explore carefully selected off-plan developer projects across the UAE — new launches, payment plans, completion dates and investment analysis." path="/off-plan" />
      <PageHero eyebrow="Off-Plan" title="New Launches & Developer Opportunities" subtitle="Explore carefully selected off-plan projects with flexible payment plans, defined completion dates and clear developer information." image="https://images.unsplash.com/photo-1728970381320-b40a223e46d5?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000" />

      <Section>
        <div className="mb-8 rounded-xl border border-amber-300 bg-[#FAF5E8] p-5 text-sm text-slate-700" data-testid="offplan-disclaimer">
          <strong className="text-slate-900">Disclaimer:</strong> Investment returns, rental yields and capital appreciation are not guaranteed and depend on market conditions.
        </div>
        <PropertyGrid fixed={{ status: "offplan" }} />
      </Section>

      <Section className="bg-white">
        <SectionHeading eyebrow="What We Cover" title="Every Project, Clearly Explained" subtitle="For each off-plan opportunity we help you understand the key parameters that matter." />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {["New Launches", "Payment Plans", "Completion Dates", "Developer Information", "Project Location", "Expected Rental Opportunities", "Investment Analysis", "Handover Details"].map((t, i) => (
            <div key={i} className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-5 font-medium text-slate-800 text-sm" data-testid={`offplan-cover-${i}`}>{t}</div>
          ))}
        </div>
      </Section>
      <CTASection waContext="invest" />
    </div>
  );
}
